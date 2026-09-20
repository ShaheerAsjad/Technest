'use client';

import { useEffect, useState } from 'react';

const DEPARTMENTS = { networking: 'Networking & IT', consumer: 'Consumer Tech' };

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ name: '', department: 'networking', parentId: '', sortOrder: 0 });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      if (res.ok) setCats(await res.json());
    } catch {
      setMsg({ ok: false, text: 'Could not load categories.' });
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function patch(id, body) {
    setBusyId(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Update failed');
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusyId(null);
  }

  async function remove(c) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    setBusyId(c.id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Delete failed');
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusyId(null);
  }

  async function create(e) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not create category');
      setForm({ name: '', department: form.department, parentId: '', sortOrder: 0 });
      setMsg({ ok: true, text: 'Category created.' });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
  }

  const ordered = ['networking', 'consumer'].flatMap((d) =>
    cats.filter((c) => c.department === d).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  );
  const nameOf = (id) => cats.find((c) => c.id === id)?.name || '';

  return (
    <div>
      <h1 className="admin-page-title">Categories</h1>
      <p className="admin-page-subtitle">
        Organise the catalogue into departments and (sub-)categories. <strong>Department</strong> keeps the new Networking &amp; IT range separate from the original Consumer Tech products — nothing is hidden or deleted.
      </p>

      {msg && <div className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`}>{msg.text}</div>}

      <div className="admin-panel">
        <h2 className="admin-panel__title">Add category</h2>
        <form className="admin-cat-form" onSubmit={create}>
          <input className="form-input" placeholder="Category name" value={form.name} maxLength={100} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="form-input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            {Object.entries(DEPARTMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="form-input" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
            <option value="">No parent (top level)</option>
            {cats.filter((c) => !c.parentId && c.department === form.department).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="form-input" type="number" placeholder="Order" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          <button type="submit" className="btn btn--primary">Add</button>
        </form>
      </div>

      <div className="admin-panel">
        {loading ? <p className="empty-state">Loading…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Department</th><th>Parent</th><th>Order</th><th>Products</th><th>Visible</th><th /></tr></thead>
              <tbody>
                {ordered.map((c) => (
                  <tr key={c.id} style={{ opacity: c.isActive ? 1 : 0.55 }}>
                    <td>
                      <input className="admin-table__input" style={{ width: 200, paddingLeft: c.parentId ? 18 : 8 }} defaultValue={c.name}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== c.name) patch(c.id, { name: v }); }} />
                      <div className="admin-cat-slug">/category/{c.slug}</div>
                    </td>
                    <td>
                      <select className="admin-table__select" value={c.department} disabled={busyId === c.id} onChange={(e) => patch(c.id, { department: e.target.value })}>
                        {Object.entries(DEPARTMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="admin-table__select" value={c.parentId || ''} disabled={busyId === c.id} onChange={(e) => patch(c.id, { parentId: e.target.value || null })}>
                        <option value="">— top level —</option>
                        {cats.filter((p) => p.id !== c.id && !p.parentId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {c.parentId && <div className="admin-cat-slug">under {nameOf(c.parentId)}</div>}
                    </td>
                    <td><input className="admin-table__input" type="number" style={{ width: 70 }} defaultValue={c.sortOrder}
                      onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== c.sortOrder) patch(c.id, { sortOrder: v }); }} /></td>
                    <td>{c.productCount}</td>
                    <td>
                      <button className="btn btn--secondary admin-table__btn-sm" disabled={busyId === c.id} onClick={() => patch(c.id, { isActive: !c.isActive })}>
                        {c.isActive ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="admin-table__actions">
                      <button className="btn admin-table__btn-sm admin-table__btn-danger" disabled={busyId === c.id} onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ordered.length === 0 && <p className="empty-state">No categories yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
