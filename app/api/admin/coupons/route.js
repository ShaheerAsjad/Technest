import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess('coupons');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const coupons = await sql`SELECT * FROM coupons ORDER BY created_at DESC`;
  return NextResponse.json(coupons);
}

export async function POST(request) {
  const access = await requireStaffAccess('coupons');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { code, discountType, discountValue, expiresAt } = await request.json();

  if (!code || !discountValue || Number(discountValue) <= 0) {
    return NextResponse.json({ error: 'A code and a positive discount value are required.' }, { status: 400 });
  }

  try {
    const [coupon] = await sql`
      INSERT INTO coupons (code, discount_type, discount_value, expires_at, created_by)
      VALUES (${code.toUpperCase()}, ${discountType || 'percent'}, ${discountValue}, ${expiresAt || null}, ${access.user.id})
      RETURNING *
    `;

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'coupon.created',
      targetType: 'coupon',
      targetId: coupon.id,
      details: { code: coupon.code },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (String(error).includes('duplicate key')) {
      return NextResponse.json({ error: 'That coupon code already exists.' }, { status: 409 });
    }
    console.error('Coupon create error:', error);
    return NextResponse.json({ error: 'Could not create coupon.' }, { status: 500 });
  }
}
