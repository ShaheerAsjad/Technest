import sql from '@/lib/db';
import { json, readJson, serverError, NO_STORE } from '@/lib/api';
import { requireStaffAccess, actorName } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';
import { cleanText } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess('coupons');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const coupons = await sql`SELECT * FROM coupons ORDER BY created_at DESC`;
    return json(coupons, 200, NO_STORE);
  } catch (err) {
    return serverError('admin/coupons GET', err, 'Failed to load coupons.');
  }
}

export async function POST(request) {
  const access = await requireStaffAccess('coupons');
  if (!access.ok) return json({ error: access.error }, access.status, NO_STORE);
  try {
    const b = await readJson(request);
    const code = cleanText(b?.code, 50).toUpperCase().replace(/\s+/g, '');
    const type = ['percent', 'flat', 'free_shipping'].includes(b?.discountType) ? b.discountType : 'percent';
    const value = Number(b?.discountValue);
    if (!code) return json({ error: 'A coupon code is required.' }, 400, NO_STORE);
    if (type !== 'free_shipping' && (!Number.isFinite(value) || value <= 0)) {
      return json({ error: 'A positive discount value is required.' }, 400, NO_STORE);
    }
    if (type === 'percent' && value > 100) return json({ error: 'Percent discount cannot exceed 100.' }, 400, NO_STORE);

    const minOrder = Math.max(0, Number(b?.minOrderAmount) || 0);
    const maxUses = b?.maxUses === '' || b?.maxUses === null || b?.maxUses === undefined ? null : Math.max(1, Math.trunc(Number(b.maxUses)) || 1);

    const [coupon] = await sql`
      INSERT INTO coupons (code, discount_type, discount_value, expires_at, created_by, min_order_amount, max_uses, free_shipping, active)
      VALUES (${code}, ${type}, ${type === 'free_shipping' ? 0 : value}, ${b?.expiresAt || null}, ${access.user.id},
              ${minOrder}, ${maxUses}, ${type === 'free_shipping'}, TRUE)
      RETURNING *
    `;
    await writeAuditLog({ actorUserId: access.user.id, actorName: actorName(access.user), action: 'coupon.created', targetType: 'coupon', targetId: coupon.id, details: { code: coupon.code } });
    return json({ coupon }, 201, NO_STORE);
  } catch (err) {
    if (String(err).includes('duplicate key')) return json({ error: 'That coupon code already exists.' }, 409, NO_STORE);
    return serverError('admin/coupons POST', err, 'Could not create coupon.');
  }
}
