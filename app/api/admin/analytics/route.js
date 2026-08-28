import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const access = await requireStaffAccess('analytics');
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const [totals] = await sql`
      SELECT
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS order_count
      FROM orders
    `;

    const statusBreakdown = await sql`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
    `;

    const recentOrders = await sql`
      SELECT id, total_amount, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 30
    `;

    // Top-selling items: parse the JSONB items array on every order.
    const allOrders = await sql`SELECT items FROM orders`;
    const salesByProduct = {};
    for (const order of allOrders) {
      const items = Array.isArray(order.items) ? order.items : [];
      for (const item of items) {
        const name = item.name || item.title || 'Unknown';
        const qty = Number(item.quantity) || 1;
        salesByProduct[name] = (salesByProduct[name] || 0) + qty;
      }
    }
    const topProducts = Object.entries(salesByProduct)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    return NextResponse.json({
      revenue: Number(totals?.revenue || 0),
      orderCount: Number(totals?.order_count || 0),
      statusBreakdown,
      recentOrders,
      topProducts,
    });
  } catch (err) {
    console.error('[admin/analytics] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to load analytics. Please try again.' },
      { status: 500 }
    );
  }
}
