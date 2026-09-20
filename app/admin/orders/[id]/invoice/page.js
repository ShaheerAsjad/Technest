import { notFound, redirect } from 'next/navigation';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { getStoreSettings } from '@/lib/settings';
import { formatPrice, formatDateTime } from '@/lib/format';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Invoice' };

/** Printable invoice / packing slip: /admin/orders/<id>/invoice */
export default async function InvoicePage({ params }) {
  const access = await requireStaffAccess('orders');
  if (!access.ok) redirect('/admin');

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (!Number.isFinite(id)) notFound();

  const rows = await sql`SELECT * FROM orders WHERE id = ${id} LIMIT 1`;
  const o = rows[0];
  if (!o) notFound();
  const { store } = await getStoreSettings();

  let items = o.items;
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch { items = []; } }
  items = Array.isArray(items) ? items : [];

  const hasBreakdown = o.subtotal !== null && o.subtotal !== undefined;

  return (
    <div className="invoice">
      <div className="invoice__actions"><PrintButton /></div>

      <header className="invoice__head">
        <div>
          <h1>{store.name || 'TechNest'}</h1>
          {store.address && <p>{store.address}</p>}
          {store.phone && <p>{store.phone}</p>}
          {store.email && <p>{store.email}</p>}
        </div>
        <div className="invoice__meta">
          <h2>INVOICE</h2>
          <p><strong>Order #</strong> {o.id}</p>
          <p><strong>Date</strong> {formatDateTime(o.created_at)}</p>
          <p><strong>Status</strong> {o.status}</p>
          <p><strong>Payment</strong> {o.payment_method} ({o.payment_status || 'Pending'})</p>
        </div>
      </header>

      <section className="invoice__cust">
        <h3>Deliver to</h3>
        <p><strong>{o.customer_name}</strong></p>
        <p>{o.address}</p>
        <p>{o.city}</p>
        <p>Phone: {o.phone}</p>
        {o.notes && <p>Notes: {o.notes}</p>}
      </section>

      <table className="invoice__table">
        <thead><tr><th>#</th><th>Item</th><th>SKU</th><th className="r">Price</th><th className="r">Qty</th><th className="r">Total</th></tr></thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{it.name || it.title || 'Product'}</td>
              <td>{it.sku || '—'}</td>
              <td className="r">{formatPrice(it.price)}</td>
              <td className="r">{it.quantity || 1}</td>
              <td className="r">{formatPrice(Number(it.price) * (it.quantity || 1))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="invoice__totals">
        <tbody>
          {hasBreakdown && <tr><td>Subtotal</td><td className="r">{formatPrice(o.subtotal)}</td></tr>}
          {Number(o.discount_amount) > 0 && <tr><td>Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</td><td className="r">− {formatPrice(o.discount_amount)}</td></tr>}
          {hasBreakdown && <tr><td>Shipping</td><td className="r">{Number(o.shipping_fee) > 0 ? formatPrice(o.shipping_fee) : 'Free'}</td></tr>}
          {Number(o.tax_amount) > 0 && <tr><td>Tax</td><td className="r">{formatPrice(o.tax_amount)}</td></tr>}
          {Number(o.cod_fee) > 0 && <tr><td>COD fee</td><td className="r">{formatPrice(o.cod_fee)}</td></tr>}
          <tr className="grand"><td>Total</td><td className="r">{formatPrice(o.total_amount)}</td></tr>
        </tbody>
      </table>

      <p className="invoice__foot">Thank you for shopping with {store.name || 'us'}!</p>
    </div>
  );
}
