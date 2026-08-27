import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const access = await requireStaffAccess('orders');
  if (!access.ok) {
    return new Response(JSON.stringify({ error: access.error }), {
      status: access.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const orders = await sql`SELECT id, customer_name, phone, address, city, total_amount, payment_method, status, created_at FROM orders ORDER BY created_at DESC`;

  const header = ['Order ID', 'Customer', 'Phone', 'Address', 'City', 'Total', 'Payment', 'Status', 'Date'];
  const rows = orders.map((o) => [
    o.id, o.customer_name, o.phone, o.address, o.city, o.total_amount, o.payment_method, o.status,
    new Date(o.created_at).toISOString(),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="technest-orders-${Date.now()}.csv"`,
    },
  });
}
