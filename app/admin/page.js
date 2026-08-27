'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const json = await res.json();
        if (res.ok) setData(json);
        else setError(json.error || 'Could not load analytics.');
      } catch {
        setError('Something went wrong.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="empty-state">Loading dashboard…</p>;
  if (error) return <p className="form-error">{error}</p>;

  const maxTopQty = Math.max(...(data.topProducts.map((p) => p.qty) || [1]), 1);

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Revenue</span>
          <span className="admin-stat-card__value">${data.revenue.toFixed(2)}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Orders</span>
          <span className="admin-stat-card__value">{data.orderCount}</span>
        </div>
        {data.statusBreakdown.map((s) => (
          <div className="admin-stat-card" key={s.status}>
            <span className="admin-stat-card__label">{s.status || 'Unknown'}</span>
            <span className="admin-stat-card__value">{s.count}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <h2 className="admin-panel__title">Top Selling Products</h2>
        {data.topProducts.length === 0 ? (
          <p className="empty-state">No sales data yet.</p>
        ) : (
          <div className="admin-bar-chart">
            {data.topProducts.map((p) => (
              <div className="admin-bar-chart__row" key={p.name}>
                <span className="admin-bar-chart__label">{p.name}</span>
                <div className="admin-bar-chart__track">
                  <div
                    className="admin-bar-chart__fill"
                    style={{ width: `${(p.qty / maxTopQty) * 100}%` }}
                  />
                </div>
                <span className="admin-bar-chart__value">{p.qty}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__header-row">
          <h2 className="admin-panel__title">Recent Orders</h2>
          <a href="/api/admin/export/orders" className="btn btn--secondary">
            Export All as CSV
          </a>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Total</th><th>Date</th></tr>
          </thead>
          <tbody>
            {data.recentOrders.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>${Number(o.total_amount).toFixed(2)}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
