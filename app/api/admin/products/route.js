import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess('inventory');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const products = await sql`
    SELECT p.id, p.title, p.price, p.stock, p.image, p.is_archived, c.name AS category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id ASC
  `;

  return NextResponse.json(products);
}
