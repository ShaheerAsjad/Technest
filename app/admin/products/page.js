'use client';

import { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function setEdit(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function saveEdit(id) {
    const edit = edits[id];
    if (!edit) return;
    const body = {};
    if (edit.stock !== undefined) body.stock = Number(edit.stock);
    if (edit.price !== undefined) body.price = Number(edit.price);

    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...body } : p)));
      setEdits((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  }

  async function toggleArchive(id, current) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_archived: !current }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_archived: !current } : p)));
    }
  }

  if (loading) return <p className="empty-state">Loading inventory…</p>;

  return (
    <div>
      <h1 className="admin-page-title">Inventory</h1>
      <p className="admin-page-subtitle">
        Stock reaching 0 automatically shows &ldquo;Out of Stock&rdquo; on the storefront. Archiving hides a
        product from the public site without deleting its order history.
      </p>

      <div className="admin-panel">
        <table className="admin-table">
          <thead>
            <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className={p.is_archived ? 'admin-table__row--archived' : ''}>
                <td className="admin-table__product-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" className="admin-table__thumb" />
                  {p.title}
                </td>
                <td>{p.category || '—'}</td>
                <td>
                  <input
                    type="number"
                    className="admin-table__input"
                    defaultValue={p.price}
                    onChange={(e) => setEdit(p.id, 'price', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="admin-table__input"
                    defaultValue={p.stock}
                    onChange={(e) => setEdit(p.id, 'stock', e.target.value)}
                  />
                </td>
                <td>
                  {p.is_archived ? (
                    <span className="admin-badge admin-badge--muted">Archived</span>
                  ) : p.stock <= 0 ? (
                    <span className="admin-badge admin-badge--danger">Out of Stock</span>
                  ) : (
                    <span className="admin-badge admin-badge--success">In Stock</span>
                  )}
                </td>
                <td className="admin-table__actions">
                  {edits[p.id] && (
                    <button className="btn btn--primary admin-table__btn-sm" onClick={() => saveEdit(p.id)}>
                      Save
                    </button>
                  )}
                  <button className="btn btn--secondary admin-table__btn-sm" onClick={() => toggleArchive(p.id, p.is_archived)}>
                    {p.is_archived ? 'Restore' : 'Archive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
