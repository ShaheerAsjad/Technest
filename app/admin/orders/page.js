'use client';

import { useEffect, useState } from 'react';

const STATUSES = ['Order Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/orders');
    if (res.ok) setOrders(await res.json());
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
