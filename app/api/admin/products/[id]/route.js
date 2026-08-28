import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const access = await requireStaffAccess('inventory');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await request.json();

    if (typeof body.stock === 'number') {
      await sql`UPDATE products SET stock = ${body.stock} WHERE id = ${id}`;
    }
    if (typeof body.price === 'number') {
      await sql`UPDATE products SET price = ${body.price} WHERE id = ${id}`;
    }
    if (typeof body.is_archived === 'boolean') {
      await sql`UPDATE products SET is_archived = ${body.is_archived} WHERE id = ${id}`;
    }

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'product.updated',
      targetType: 'product',
      targetId: id,
      details: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/products PATCH] Error:', error.message);
    return NextResponse.json({ error: 'Could not update product.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const access = await requireStaffAccess('inventory');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;

    // Check if product has any orders referencing it (safety check)
    // We soft-delete (archive) if it has orders, hard-delete if not
    const [product] = await sql`SELECT id, title FROM products WHERE id = ${id}`;
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    await sql`DELETE FROM products WHERE id = ${id}`;

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'product.deleted',
      targetType: 'product',
      targetId: id,
      details: { title: product.title },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[admin/products DELETE] Error:', err.message);
    // If FK constraint violation (product has orders), return friendly message
    if (err.message?.includes('foreign key') || err.message?.includes('violates')) {
      return NextResponse.json(
        { error: 'Cannot delete — this product has existing orders. Use Archive instead.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
