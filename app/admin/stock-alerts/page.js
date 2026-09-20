'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/format';

export default function AdminStockAlertsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stock-alerts', { cache: 'no-store' });
      if (res.ok) setRows(await res.json());
    } catch {
      setMsg({ ok: false, text: 'Could not load the list.' });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function call(method, productId) {
    setBusy(productId); setMsg(null);
    try {
      const res = await fetch('/api/admin/stock-alerts', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed');
      if (method === 'POST') {
        setMsg({ ok: true, text: j.sent ? `${j.sent} customer(s) e-mailed.` : (j.skipped ? 'E-mail service is not configured (add RESEND_API_KEY) - nobody was e-mailed.' : 'Nobody is waiting for this product, or it is still out of stock.') });
      }
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusy(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">Stock Alerts</h1>
      <p className="admin-page-subtitle">
        Customers who clicked <strong>&quot;Notify me&quot;</strong> on an out-of-stock product. When you add stock to a product in Inventory,
        everybody waiting is e-mailed automatically (needs <code>RESEND_API_KEY</code>). You can also send it manually here.
      </p>
      {msg && <div className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`}>{msg.text}</div>}
      <div className="admin-panel">
        {loading ? <p className="empty-state">Loading…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Stock now</th><th>Waiting</th><th>Total requests</th><th>Last request</th><th /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.product_id}>
                    <td>{r.slug ? <a className="admin-link" href={`/products/${r.slug}`} target="_blank" rel="noopener noreferrer">{r.title}</a> : (r.title || `#${r.product_id}`)}</td>
                    <td>{r.stock ?? '—'}</td>
                    <td><strong>{r.pending}</strong></td>
                    <td>{r.total}</td>
                    <td>{r.last_request ? formatDateTime(r.last_request) : '—'}</td>
                    <td className="admin-table__actions">
                      <button className="btn btn--primary admin-table__btn-sm" disabled={busy === r.product_id || r.pending === 0 || Number(r.stock) <= 0} onClick={() => call('POST', r.product_id)} title={Number(r.stock) <= 0 ? 'Add stock first' : ''}>Notify now</button>
                      <button className="btn admin-table__btn-sm admin-table__btn-danger" disabled={busy === r.product_id} onClick={() => confirm('Remove this waiting list?') && call('DELETE', r.product_id)}>Clear</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="empty-state">Nobody is waiting for a product right now.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
