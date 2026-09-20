'use client';

import { useState } from 'react';

const toSpecsText = (specs) =>
  Object.entries(specs && typeof specs === 'object' ? specs : {}).map(([k, v]) => `${k}: ${v}`).join('\n');

function parseSpecs(text) {
  const out = {};
  String(text || '').split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i < 1) return;
    const k = line.slice(0, i).trim(); const v = line.slice(i + 1).trim();
    if (k && v) out[k] = v;
  });
  return out;
}

/** Edit ALL details of an existing product (the table only allowed price / stock before). */
export default function ProductEditModal({ product, categories = [], onClose, onSaved }) {
  const p = product;
  const gallery = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const main = p.image && p.image !== '/placeholder.svg' ? p.image : gallery[0] || '';
  const [f, setF] = useState({
    title: p.title || '',
    description: p.description || '',
    categoryId: p.category_id ? String(p.category_id) : '',
    brand: p.brand || '',
    sku: p.sku || '',
    price: p.price ?? '',
    oldPrice: Number(p.original_price) > Number(p.price) ? p.original_price : '',
    stock: p.stock ?? 0,
    taxRate: p.tax_rate ?? '',
    isFeatured: Boolean(p.is_featured),
    freeShipping: Boolean(p.free_shipping),
    image: main,
    extraImages: gallery.filter((g) => g !== main).join('\n'),
    specs: toSpecsText(p.specs),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function upload(file, target) {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Upload failed');
      if (target === 'main') setF((s) => ({ ...s, image: j.url }));
      else setF((s) => ({ ...s, extraImages: s.extraImages ? `${s.extraImages}\n${j.url}` : j.url }));
    } catch (err) {
      setError(err.message);
    }
    setUploading(false);
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    const price = Number(f.price); const stock = Math.trunc(Number(f.stock)); const old = f.oldPrice === '' ? null : Number(f.oldPrice);
    if (f.title.trim().length < 2) return setError('Title is required.');
    if (!Number.isFinite(price) || price <= 0) return setError('Price must be greater than 0.');
    if (!Number.isFinite(stock) || stock < 0) return setError('Stock cannot be negative.');
    if (old !== null && (!Number.isFinite(old) || old <= 0)) return setError('Old price is not valid.');

    const extra = f.extraImages.split('\n').map((s) => s.trim()).filter(Boolean);
    const image = f.image.trim() || extra[0] || '/placeholder.svg';
    const images = [image, ...extra.filter((u) => u !== image)].filter((u) => u !== '/placeholder.svg');
    const body = {
      title: f.title, description: f.description, categoryId: f.categoryId || null, brand: f.brand, sku: f.sku,
      price, originalPrice: old && old > price ? old : price, isOnSale: Boolean(old && old > price), stock,
      taxRate: f.taxRate === '' ? null : Number(f.taxRate), isFeatured: f.isFeatured, freeShipping: f.freeShipping,
      image, images, specs: parseSpecs(f.specs),
    };
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not save the product.');
      onSaved?.(j);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={`Edit ${p.title}`}>
      <div className="admin-modal__backdrop" onClick={onClose} />
      <form className="admin-modal__panel" onSubmit={save}>
        <div className="admin-modal__head">
          <h2>Edit product</h2>
          <button type="button" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="admin-modal__body">
          {error && <div className="notice notice--error" role="alert">{error}</div>}

          <div className="admin-field"><label>Title *</label><input className="form-input" value={f.title} onChange={set('title')} maxLength={200} required /></div>
          <div className="admin-form-grid">
            <div className="admin-field"><label>Category</label>
              <select className="form-input" value={f.categoryId} onChange={set('categoryId')}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.label || c.name}</option>)}
              </select>
            </div>
            <div className="admin-field"><label>Brand</label><input className="form-input" value={f.brand} onChange={set('brand')} maxLength={120} /></div>
            <div className="admin-field"><label>SKU / Model no.</label><input className="form-input" value={f.sku} onChange={set('sku')} maxLength={80} /></div>
          </div>
          <div className="admin-form-grid">
            <div className="admin-field"><label>Price (Rs.) *</label><input className="form-input" type="number" min="0" step="0.01" value={f.price} onChange={set('price')} required /></div>
            <div className="admin-field"><label>Old price (Rs.) <small>optional - shows a discount</small></label><input className="form-input" type="number" min="0" step="0.01" value={f.oldPrice} onChange={set('oldPrice')} /></div>
            <div className="admin-field"><label>Stock *</label><input className="form-input" type="number" min="0" value={f.stock} onChange={set('stock')} required /></div>
            <div className="admin-field"><label>Tax % <small>blank = store default</small></label><input className="form-input" type="number" min="0" max="100" step="0.01" value={f.taxRate} onChange={set('taxRate')} /></div>
          </div>
          <div className="admin-field"><label>Description</label><textarea className="form-input form-textarea" rows={4} value={f.description} onChange={set('description')} maxLength={5000} /></div>

          <div className="admin-field">
            <label>Main image (URL or upload)</label>
            <div className="admin-modal__row">
              <input className="form-input" value={f.image} onChange={set('image')} placeholder="https://... or /products/name.jpg" />
              <label className="btn btn--secondary admin-table__btn-sm">{uploading ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0], 'main')} />
              </label>
            </div>
            {f.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.image} alt="" className="admin-modal__preview" />}
          </div>
          <div className="admin-field">
            <label>More images <small>one URL per line (max 9)</small></label>
            <textarea className="form-input form-textarea" rows={3} value={f.extraImages} onChange={set('extraImages')} />
            <label className="btn btn--secondary admin-table__btn-sm" style={{ alignSelf: 'flex-start' }}>Upload another image
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => upload(e.target.files?.[0], 'extra')} />
            </label>
          </div>
          <div className="admin-field">
            <label>Specifications <small>one per line: Name: Value</small></label>
            <textarea className="form-input form-textarea" rows={4} value={f.specs} onChange={set('specs')} placeholder={'Speed: 10 Gbps\nReach: 80 km'} />
          </div>

          <div className="admin-modal__checks">
            <label><input type="checkbox" checked={f.isFeatured} onChange={set('isFeatured')} /> Featured on the home page</label>
            <label><input type="checkbox" checked={f.freeShipping} onChange={set('freeShipping')} /> Free shipping on this product</label>
          </div>
        </div>
        <div className="admin-modal__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving || uploading}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}
