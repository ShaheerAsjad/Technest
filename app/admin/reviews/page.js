'use client';

import { useEffect, useState } from 'react';
import { formatDateTime, renderStars } from '@/lib/format';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
      if (res.ok) setReviews(await res.json());
      else setMsg({ ok: false, text: 'You do not have access to reviews.' });
    } catch {
      setMsg({ ok: false, text: 'Could not load reviews.' });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function remove(r) {
    if (!confirm('Delete this review permanently?')) return;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/reviews/${r.id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Delete failed');
      setReviews((prev) => prev.filter((x) => x.id !== r.id));
      setMsg({ ok: true, text: 'Review deleted.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusyId(null);
  }

  return (
    <div>
      <h1 className="admin-page-title">Reviews</h1>
      <p className="admin-page-subtitle">Newest customer reviews. Delete spam or abusive ones — the product rating updates automatically.</p>
      {msg && <div className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`}>{msg.text}</div>}
      <div className="admin-panel">
        {loading ? <p className="empty-state">Loading…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Comment</th><th>Date</th><th /></tr></thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.product_slug ? <a className="admin-link" href={`/products/${r.product_slug}`} target="_blank" rel="noopener noreferrer">{r.product_title || `#${r.product_id}`}</a> : (r.product_title || `#${r.product_id}`)}</td>
                    <td>{r.user_name || '—'}</td>
                    <td style={{ color: '#FFB020', whiteSpace: 'nowrap' }}>{renderStars(r.rating)}</td>
                    <td style={{ maxWidth: 380, whiteSpace: 'pre-wrap' }}>{r.comment || <em style={{ color: '#71717a' }}>(no comment)</em>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.created_at)}</td>
                    <td className="admin-table__actions">
                      <button className="btn admin-table__btn-sm admin-table__btn-danger" disabled={busyId === r.id} onClick={() => remove(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reviews.length === 0 && <p className="empty-state">No reviews yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
