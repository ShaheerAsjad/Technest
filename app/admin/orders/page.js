'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
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

  async function updateStatus(id, status) {
    setUpdatingId(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
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

  return (
    <div>
      <div className="admin-panel__header-row">
        <h1 className="admin-page-title">Orders</h1>
        <a href="/api/admin/export/orders" className="btn btn--secondary">Export CSV</a>
      </div>

      <div className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Customer</th><th>Email</th><th>Total</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.customer_name}</td>
                <td>{o.customer_email || '—'}</td>
                <td>${Number(o.total_amount).toFixed(2)}</td>
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
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="empty-state">No orders yet.</p>}
      </div>
    </div>
  );
}
