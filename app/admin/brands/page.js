'use client';

import { useEffect, useState } from 'react';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ name: '', logo: '', featured: true });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands', { cache: 'no-store' });
      if (res.ok) setBrands(await res.json());
    } catch {
      setMsg({ ok: false, text: 'Could not load brands.' });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function api(url, method, body) {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || 'Request failed');
    return j;
  }

  async function patch(id, body) {
    setBusyId(id); setMsg(null);
    try { await api(`/api/admin/brands/${id}`, 'PATCH', body); await load(); } catch (err) { setMsg({ ok: false, text: err.message }); }
    setBusyId(null);
  }

  async function upload(id, file) {
    if (!file) return;
    setBusyId(id); setMsg(null);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Upload failed');
      if (id === 'new') setForm((f) => ({ ...f, logo: j.url }));
      else { await api(`/api/admin/brands/${id}`, 'PATCH', { logo: j.url }); await load(); }
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusyId(null);
  }

  async function remove(b) {
    if (!confirm(`Delete brand "${b.name}"? Products keep their brand text.`)) return;
    setBusyId(b.id); setMsg(null);
    try { await api(`/api/admin/brands/${b.id}`, 'DELETE'); await load(); } catch (err) { setMsg({ ok: false, text: err.message }); }
    setBusyId(null);
  }

  async function create(e) {
    e.preventDefault(); setMsg(null);
    try {
      await api('/api/admin/brands', 'POST', form);
      setForm({ name: '', logo: '', featured: true });
      setMsg({ ok: true, text: 'Brand added.' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  return (
    <div>
      <h1 className="admin-page-title">Brands</h1>
      <p className="admin-page-subtitle">
        Brands shown in the &quot;Trusted brands&quot; strip on the home page. Only <strong>Featured</strong> brands that have products are shown; a logo is optional (the name is shown otherwise).
      </p>
      {msg && <div className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`}>{msg.text}</div>}

      <div className="admin-panel">
        <h2 className="admin-panel__title">Add brand</h2>
        <form className="admin-cat-form" onSubmit={create}>
          <input className="form-input" placeholder="Brand name" value={form.name} maxLength={120} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="form-input" placeholder="Logo URL (optional)" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
          <label className="btn btn--secondary admin-table__btn-sm">Upload logo
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload('new', e.target.files?.[0])} />
          </label>
          <label className="admin-toggle" style={{ margin: 0 }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <span className="admin-toggle__box" aria-hidden="true" />
            <span className="admin-toggle__text">Featured</span>
          </label>
          <button type="submit" className="btn btn--primary">Add</button>
        </form>
      </div>

      <div className="admin-panel">
        {loading ? <p className="empty-state">Loading…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Logo</th><th>Name</th><th>Products</th><th>Order</th><th>Featured</th><th>Visible</th><th /></tr></thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id} style={{ opacity: b.is_active ? 1 : 0.55 }}>
                    <td>
                      {b.logo_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.logo_url} alt="" style={{ height: 28, maxWidth: 90, objectFit: 'contain', background: '#fff', borderRadius: 4, padding: 2 }} /> : <span className="admin-cat-slug">none</span>}
                      <label className="admin-link" style={{ display: 'block', cursor: 'pointer', fontSize: 12 }}>change
                        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(b.id, e.target.files?.[0])} />
                      </label>
                    </td>
                    <td><input className="admin-table__input" style={{ width: 160 }} defaultValue={b.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== b.name) patch(b.id, { name: v }); }} /></td>
                    <td>{b.product_count}</td>
                    <td><input className="admin-table__input" type="number" style={{ width: 70 }} defaultValue={b.sort_order} onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== b.sort_order) patch(b.id, { sort: v }); }} /></td>
                    <td><button className="btn btn--secondary admin-table__btn-sm" disabled={busyId === b.id} onClick={() => patch(b.id, { featured: !b.is_featured })}>{b.is_featured ? 'Yes' : 'No'}</button></td>
                    <td><button className="btn btn--secondary admin-table__btn-sm" disabled={busyId === b.id} onClick={() => patch(b.id, { isActive: !b.is_active })}>{b.is_active ? 'Visible' : 'Hidden'}</button></td>
                    <td className="admin-table__actions"><button className="btn admin-table__btn-sm admin-table__btn-danger" disabled={busyId === b.id} onClick={() => remove(b)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {brands.length === 0 && <p className="empty-state">No brands yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
