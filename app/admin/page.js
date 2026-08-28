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
      } catch (err) {
        setError('Something went wrong loading dashboard analytics.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="empty-state">Loading dashboard…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!data) return <p className="empty-state">No analytics data available.</p>;

  const topProducts = Array.isArray(data.topProducts) ? data.topProducts : [];
  const recentOrders = Array.isArray(data.recentOrders) ? data.recentOrders : [];
  const statusBreakdown = Array.isArray(data.statusBreakdown) ? data.statusBreakdown : [];
  const revenue = Number(data.revenue) || 0;
  const orderCount = Number(data.orderCount) || 0;

  const maxTopQty = topProducts.length > 0 ? Math.max(...topProducts.map((p) => Number(p.qty) || 1), 1) : 1;

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Revenue</span>
          <span className="admin-stat-card__value">${revenue.toFixed(2)}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Orders</span>
          <span className="admin-stat-card__value">{orderCount}</span>
        </div>
        {statusBreakdown.map((s) => (
          <div className="admin-stat-card" key={s.status || 'unknown'}>
            <span className="admin-stat-card__label">{s.status || 'Unknown'}</span>
            <span className="admin-stat-card__value">{s.count}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel">
        <h2 className="admin-panel__title">Top Selling Products</h2>
        {topProducts.length === 0 ? (
          <p className="empty-state">No sales data yet.</p>
        ) : (
          <div className="admin-bar-chart">
            {topProducts.map((p) => (
              <div className="admin-bar-chart__row" key={p.name}>
                <span className="admin-bar-chart__label">{p.name}</span>
                <div className="admin-bar-chart__track">
                  <div
                    className="admin-bar-chart__fill"
                    style={{ width: `${((Number(p.qty) || 0) / maxTopQty) * 100}%` }}
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
        {recentOrders.length === 0 ? (
          <p className="empty-state">No recent orders found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Total</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>${Number(o.total_amount).toFixed(2)}</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
