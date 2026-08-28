'use client';

import { useEffect, useState, useRef } from 'react';

const EMPTY_PRODUCT_FORM = {
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  stock: '',
  image: '',
  categoryId: '',
  isOnSale: false,
  isFeatured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PRODUCT_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const fileInputRef = useRef(null);

  async function loadData() {
    setLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      if (resProd.ok) setProducts(await resProd.json());
      if (resCat.ok) setCategories(await resCat.json());
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      setEdits((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
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

  async function deleteProduct(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(json.error || 'Could not delete product.');
      }
    } catch {
      alert('Network error deleting product.');
    } finally {
      setDeletingId(null);
    }
  }

  // Handle Local File Upload (Mobile or Laptop / PC)
  async function handleFileUpload(file) {
    if (!file) return;
    setUploadingImage(true);
    setAddError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.url) {
        setForm((p) => ({ ...p, image: json.url }));
      } else {
        setAddError(json.error || 'Failed to upload image.');
      }
    } catch (err) {
      setAddError('Error uploading file. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddLoading(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (res.ok) {
        setAddSuccess(json.message || `✅ Product "${form.title}" added successfully!`);
        setForm(EMPTY_PRODUCT_FORM);
        loadData();
      } else {
        setAddError(json.error || 'Could not add product.');
      }
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  }

  const cardStyle = {
    backgroundColor: 'var(--admin-surface, #18181b)',
    border: '1px solid var(--admin-border, #27272a)',
    borderRadius: '1rem',
    padding: '24px',
    marginBottom: '24px',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#0f0f10',
    border: '1px solid #3f3f46',
    borderRadius: '0.75rem',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Inventory</h1>
        <button
          id="add-product-btn"
          className="btn btn--primary"
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddError('');
            setAddSuccess('');
          }}
        >
          {showAddForm ? '✕ Cancel' : '+ Add New Product'}
        </button>
      </div>

      <p className="admin-page-subtitle">
        Manage your product catalog directly from here. Stock reaching 0 shows &ldquo;Out of Stock&rdquo; on the storefront.
        Archiving hides a product without deleting order history.
      </p>

      {/* ── Add Product Form ── */}
      {showAddForm && (
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#fff', fontWeight: '700' }}>
            📦 Add New Product
          </h2>

          <form onSubmit={handleAddProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Product Title *</label>
                <input
                  id="prod-title"
                  type="text"
                  required
                  style={inputStyle}
                  placeholder="e.g. Wireless Noise-Canceling Headphones"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Price ($) *</label>
                <input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  required
                  style={inputStyle}
                  placeholder="199.99"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Original Price ($)</label>
                <input
                  id="prod-orig-price"
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  placeholder="249.99"
                  value={form.originalPrice}
                  onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Initial Stock *</label>
                <input
                  id="prod-stock"
                  type="number"
                  required
                  min="0"
                  style={inputStyle}
                  placeholder="25"
                  value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Category</label>
                <select
                  id="prod-category"
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Image Selection & Device Upload */}
            <div style={{ marginBottom: '16px', backgroundColor: '#0f0f10', border: '1px solid #27272a', padding: '16px', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#d4d4d8' }}>
                  📷 Product Image Source
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: uploadMode === 'file' ? '#f97316' : '#27272a',
                      color: uploadMode === 'file' ? '#fff' : '#a1a1aa',
                    }}
                    onClick={() => setUploadMode('file')}
                  >
                    📁 Select / Drag from Device
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      background: uploadMode === 'url' ? '#f97316' : '#27272a',
                      color: uploadMode === 'url' ? '#fff' : '#a1a1aa',
                    }}
                    onClick={() => setUploadMode('url')}
                  >
                    🌐 Paste URL Link
                  </button>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div
                  style={{
                    border: '2px dashed #3f3f46',
                    borderRadius: '0.75rem',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#141417',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                  />
                  <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>📲</div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
                    {uploadingImage ? 'Uploading Image from Device...' : 'Click or Drag & Drop image file here'}
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                    Supports PNG, JPG, WEBP, GIF from Mobile or PC
                  </span>
                </div>
              ) : (
                <input
                  id="prod-image"
                  type="url"
                  style={inputStyle}
                  placeholder="https://images.pexels.com/..."
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                />
              )}

              {/* Image Preview Thumbnail */}
              {form.image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image}
                    alt="Preview"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #3f3f46' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>✓ Image ready for product</span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>Description</label>
              <textarea
                id="prod-desc"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Detailed features, specs, and details..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#d4d4d8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isOnSale}
                  onChange={(e) => setForm((p) => ({ ...p, isOnSale: e.target.checked }))}
                />
                Mark as On Sale
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#d4d4d8', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                />
                Feature on Homepage
              </label>
            </div>

            {addError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', color: '#ef4444', fontSize: '0.875rem', marginBottom: '16px' }}>
                {addError}
              </div>
            )}
            {addSuccess && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.75rem', color: '#22c55e', fontSize: '0.875rem', marginBottom: '16px' }}>
                {addSuccess}
              </div>
            )}

            <button id="prod-submit-btn" type="submit" className="btn btn--primary" disabled={addLoading || uploadingImage} style={{ minWidth: '160px' }}>
              {addLoading ? 'Saving...' : '📦 Save Product to Inventory'}
            </button>
          </form>
        </div>
      )}

      {/* ── Products Table ── */}
      <div className="admin-panel">
        {loading ? (
          <p className="empty-state">Loading inventory…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={p.is_archived ? 'admin-table__row--archived' : ''}>
                  <td className="admin-table__product-cell">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image || '/placeholder.png'} alt="" className="admin-table__thumb" />
                    <div>
                      <strong>{p.title}</strong>
                      {p.is_featured && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#f97316' }}>★ Featured</span>}
                    </div>
                  </td>
                  <td>{p.category || '—'}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
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
                    <button
                      className="btn btn--secondary admin-table__btn-sm"
                      onClick={() => toggleArchive(p.id, p.is_archived)}
                    >
                      {p.is_archived ? 'Restore' : 'Archive'}
                    </button>
                    <button
                      className="btn admin-table__btn-sm admin-table__btn-danger"
                      disabled={deletingId === p.id}
                      onClick={() => deleteProduct(p.id, p.title)}
                    >
                      {deletingId === p.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && products.length === 0 && <p className="empty-state">No products found in inventory.</p>}
      </div>
    </div>
  );
}
