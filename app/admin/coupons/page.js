'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/format';

const EMPTY = { code: '', discountType: 'percent', discountValue: '', expiresAt: '', minOrderAmount: '', maxUses: '' };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/coupons');
    if (res.ok) setCoupons(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createCoupon(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, discountValue: Number(form.discountValue) || 0 }),
    });
    const json = await res.json();
    if (res.ok) {
      setForm(EMPTY);
      load();
    } else {
      setError(json.error || 'Could not create coupon.');
    }
  }

  async function toggleActive(id, active) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: !active } : c)));
  }

  async function deleteCoupon(id) {
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <h1 className="admin-page-title">Coupons</h1>

      <div className="admin-panel">
        <h2 className="admin-panel__title">Create Coupon</h2>
        <form className="admin-coupon-form" onSubmit={createCoupon}>
          <input
            className="form-input"
            placeholder="CODE (e.g. SAVE20)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <select
            className="form-input"
            value={form.discountType}
            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
          >
            <option value="percent">Percent Off</option>
            <option value="flat">Flat Amount Off (Rs.)</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          <input
            className="form-input"
            type="number"
            min="0"
            placeholder={form.discountType === 'percent' ? 'Percent (1-100)' : form.discountType === 'flat' ? 'Amount in Rs.' : 'Not needed'}
            value={form.discountType === 'free_shipping' ? '' : form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            disabled={form.discountType === 'free_shipping'}
            required={form.discountType !== 'free_shipping'}
          />
          <input
            className="form-input"
            type="number"
            min="0"
            placeholder="Min. order (Rs.)"
            value={form.minOrderAmount}
            onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
          />
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="Max uses"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
          />
          <input
            className="form-input"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <button type="submit" className="btn btn--primary">Create</button>
        </form>
        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="admin-panel">
        {loading ? (
          <p className="empty-state">Loading coupons…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discount_type === 'percent' ? `${c.discount_value}%` : c.discount_type === 'free_shipping' ? 'Free shipping' : formatPrice(c.discount_value)}</td>
                  <td>{Number(c.min_order_amount) > 0 ? formatPrice(c.min_order_amount) : '—'}</td>
                  <td>{c.used_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <span className={`admin-badge ${c.active ? 'admin-badge--success' : 'admin-badge--muted'}`}>
                      {c.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    <button className="btn btn--secondary admin-table__btn-sm" onClick={() => toggleActive(c.id, c.active)}>
                      {c.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn admin-table__btn-sm admin-table__btn-danger" onClick={() => deleteCoupon(c.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && coupons.length === 0 && <p className="empty-state">No coupons yet.</p>}
      </div>
    </div>
  );
}
