'use client';

import { Fragment, useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';

const STATUSES = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  async function load() {
    setLoading(true);
    setAccessDenied(false);
    const res = await fetch('/api/admin/orders');
    if (res.ok) {
      setOrders(await res.json());
    } else if (res.status === 403) {
      setAccessDenied(true);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updatePayment(id, paymentStatus) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, payment_status: paymentStatus } : o)));
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error || 'Could not update the payment status.');
      }
    } catch {
      alert('Network error - the payment status was not changed.');
    }
    setUpdatingId(null);
  }

  async function updateStatus(id, status) {
    if (status === 'Cancelled' && !confirm(`Cancel order #${id}? The items will be put back in stock.`)) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => {
          if (o.id !== id) return o;
          const autoPaid = status === 'Delivered' && String(o.payment_method || '').toLowerCase().startsWith('cash') && (o.payment_status || 'Pending') === 'Pending';
          return { ...o, status, ...(autoPaid ? { payment_status: 'Paid' } : {}) };
        }));
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error || 'Could not update the order status.');
      }
    } catch {
      alert('Network error - the status was not changed.');
    }
    setUpdatingId(null);
  }

  if (loading) return <p className="empty-state">Loading orders…</p>;

  if (accessDenied) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', marginTop: '20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
          Access Denied
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto' }}>
          Your employee account does not have permission to view or manage Orders.
        </p>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const visibleOrders = orders.filter((o) => {
    if (statusFilter && (o.status || 'Order Placed') !== statusFilter) return false;
    if (q && !`#${o.id} ${o.customer_name || ''} ${o.phone || ''} ${o.city || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div>
      <div className="admin-panel__header-row">
        <h1 className="admin-page-title">Orders</h1>
        <a href="/api/admin/export/orders" className="btn btn--secondary">Export CSV</a>
      </div>

      <div className="admin-panel">
        <div className="admin-toolbar">
          <input className="form-input" placeholder="Search order #, name, phone or city..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search orders" />
          <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="admin-toolbar__count">{visibleOrders.length} of {orders.length}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Phone</th><th>City</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th><th>Details</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((o) => (
              <Fragment key={o.id}>
              <tr>
                <td>#{o.id}</td>
                <td>{o.customer_name}</td>
                <td>{o.phone || '—'}</td>
                <td>{o.city || '—'}</td>
                <td>{formatPrice(o.total_amount)}</td>
                <td>
                  <select
                    className="admin-table__select"
                    value={o.status || 'Order Placed'}
                    disabled={updatingId === o.id}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td>
                  <select
                    className="admin-table__select"
                    value={o.payment_status || 'Pending'}
                    disabled={updatingId === o.id}
                    onChange={(e) => updatePayment(o.id, e.target.value)}
                    aria-label={`Payment status of order ${o.id}`}
                  >
                    {['Pending', 'Paid', 'Refunded'].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="admin-cat-slug">{o.payment_method}</div>
                </td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn--secondary admin-table__btn-sm" onClick={() => setOpenId(openId === o.id ? null : o.id)}>{openId === o.id ? 'Hide' : 'View'}</button>
                </td>
              </tr>
              {openId === o.id && (
                <tr className="admin-order-details">
                  <td colSpan={9}>
                    <div className="admin-order-details__grid">
                      <div>
                        <h4>Deliver to</h4>
                        <p><strong>{o.customer_name}</strong></p>
                        <p>{o.address}</p>
                        <p>{o.city} · {o.phone}</p>
                        {o.customer_email && <p>{o.customer_email}</p>}
                        {o.notes && <p><em>Notes: {o.notes}</em></p>}
                        <p><a href={`/admin/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer" className="admin-link">Print invoice</a></p>
                      </div>
                      <div>
                        <h4>Items</h4>
                        <ul>
                          {(Array.isArray(o.items) ? o.items : []).map((it, i) => (
                            <li key={i}>{it.quantity || 1} × {it.name || it.title || 'Product'}{it.sku ? ` (${it.sku})` : ''} — {formatPrice(Number(it.price) * (it.quantity || 1))}</li>
                          ))}
                        </ul>
                        {o.subtotal !== null && o.subtotal !== undefined && (
                          <p className="admin-cat-slug">
                            Subtotal {formatPrice(o.subtotal)}{Number(o.discount_amount) > 0 ? ` · Discount −${formatPrice(o.discount_amount)}` : ''} · Shipping {Number(o.shipping_fee) > 0 ? formatPrice(o.shipping_fee) : 'Free'}{Number(o.tax_amount) > 0 ? ` · Tax ${formatPrice(o.tax_amount)}` : ''}{Number(o.cod_fee) > 0 ? ` · COD fee ${formatPrice(o.cod_fee)}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
        </div>
        {orders.length === 0 && <p className="empty-state">No orders yet.</p>}
        {orders.length > 0 && visibleOrders.length === 0 && <p className="empty-state">No orders match your search / filter.</p>}
      </div>
    </div>
  );
}
