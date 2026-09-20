'use client';

import { useEffect, useMemo, useState } from 'react';
import { computePricing } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';

const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v) || 0);

function setIn(obj, path, value) {
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  const [head, ...rest] = path;
  copy[head] = rest.length ? setIn(obj?.[head] ?? {}, rest, value) : value;
  return copy;
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="admin-toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      <span className="admin-toggle__box" aria-hidden="true" />
      <span className="admin-toggle__text">{label}{hint && <small>{hint}</small>}</span>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [denied, setDenied] = useState(false);
  const [preview, setPreview] = useState({ amount: 10000, city: 'Lahore', payment: 'cod' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        if (res.status === 401 || res.status === 403) { setDenied(true); return; }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load settings');
        // zones: keep cities as an editable comma-separated string
        data.shipping.zones = (data.shipping.zones || []).map((z) => ({ ...z, cities: (z.cities || []).join(', '), freeThreshold: z.freeThreshold ?? '' }));
        data.announcement.messagesText = (data.announcement.messages || []).join('\n');
        setS(data);
      } catch (err) {
        setMsg({ ok: false, text: err.message || 'Could not load settings.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (path, value) => setS((prev) => setIn(prev, path, value));

  const setZone = (i, key, value) =>
    setS((prev) => {
      const zones = prev.shipping.zones.map((z, idx) => (idx === i ? { ...z, [key]: value } : z));
      return setIn(prev, ['shipping', 'zones'], zones);
    });
  const addZone = () =>
    setS((prev) => setIn(prev, ['shipping', 'zones'], [...prev.shipping.zones, { id: `zone-${Date.now()}`, name: 'New zone', cities: '', fee: 0, freeThreshold: '', eta: '' }]));
  const removeZone = (i) => setS((prev) => setIn(prev, ['shipping', 'zones'], prev.shipping.zones.filter((_, idx) => idx !== i)));

  // Engine-ready copy of the (unsaved) form, used for the live preview
  const engine = useMemo(() => {
    if (!s) return null;
    return {
      shipping: {
        enabled: Boolean(s.shipping.enabled),
        defaultFee: num(s.shipping.defaultFee),
        freeEnabled: Boolean(s.shipping.freeEnabled),
        freeThreshold: num(s.shipping.freeThreshold),
        minOrder: num(s.shipping.minOrder),
        etaText: s.shipping.etaText || '',
        zones: s.shipping.zones.map((z) => ({
          ...z,
          fee: num(z.fee),
          cities: String(z.cities || '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean),
          freeThreshold: z.freeThreshold === '' || z.freeThreshold === null ? null : num(z.freeThreshold),
        })),
      },
      tax: { enabled: Boolean(s.tax.enabled), rate: Math.min(100, num(s.tax.rate)), label: s.tax.label || 'Tax', inclusive: Boolean(s.tax.inclusive), onShipping: Boolean(s.tax.onShipping) },
      payment: { codEnabled: Boolean(s.payment.codEnabled), codFee: num(s.payment.codFee), bankTransferEnabled: Boolean(s.payment.bankTransferEnabled), bankInstructions: s.payment.bankInstructions || '' },
    };
  }, [s]);

  const sample = useMemo(() => {
    if (!engine) return null;
    return computePricing({
      items: [{ id: 'x', name: 'Sample', price: num(preview.amount), quantity: 1, taxRate: null, freeShipping: false }],
      settings: engine,
      city: preview.city,
      paymentMethod: preview.payment,
    });
  }, [engine, preview]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...s,
        announcement: {
          enabled: s.announcement.enabled,
          messages: String(s.announcement.messagesText || '').split('\n').map((m) => m.trim()).filter(Boolean),
        },
      };
      const res = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save settings.');
      setMsg({ ok: true, text: 'Settings saved. They are live on the store now (allow up to ~20 seconds).' });
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Could not save settings.' });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (loading) return <p className="empty-state">Loading settings…</p>;
  if (denied) {
    return (
      <div className="admin-panel" style={{ textAlign: 'center', padding: 40 }}>
        <h2 className="admin-panel__title">Admin access required</h2>
        <p style={{ color: '#a1a1aa' }}>Only administrators can change store settings.</p>
      </div>
    );
  }
  if (!s) return <div className="notice notice--error">{msg?.text || 'Settings are not available.'}</div>;

  return (
    <div className="admin-settings">
      <div className="admin-panel__header-row">
        <h1 className="admin-page-title">Store Settings</h1>
        <button className="btn btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save all changes'}</button>
      </div>
      <p className="admin-page-subtitle">Shipping, tax, payment options and store details. Changes apply to the cart, checkout and every new order.</p>

      {msg && <div className={`notice ${msg.ok ? 'notice--ok' : 'notice--error'}`} role="status">{msg.text}</div>}

      {/* ───────────── Shipping ───────────── */}
      <div className="admin-panel">
        <h2 className="admin-panel__title">Shipping &amp; Delivery</h2>
        <Toggle checked={s.shipping.enabled} onChange={(v) => set(['shipping', 'enabled'], v)} label="Charge for shipping" hint="Turn off if delivery is always free." />
        <div className="admin-form-grid">
          <Field label="Standard delivery charge (Rs.)" hint="Used when the customer's city has no zone below.">
            <input className="form-input" type="number" min="0" value={s.shipping.defaultFee} onChange={(e) => set(['shipping', 'defaultFee'], e.target.value)} />
          </Field>
          <Field label="Minimum order amount (Rs.)" hint="0 = no minimum.">
            <input className="form-input" type="number" min="0" value={s.shipping.minOrder} onChange={(e) => set(['shipping', 'minOrder'], e.target.value)} />
          </Field>
          <Field label="Delivery time shown to customers">
            <input className="form-input" value={s.shipping.etaText} maxLength={80} onChange={(e) => set(['shipping', 'etaText'], e.target.value)} placeholder="2-5 business days" />
          </Field>
        </div>

        <Toggle checked={s.shipping.freeEnabled} onChange={(v) => set(['shipping', 'freeEnabled'], v)} label="Free shipping above an order amount" />
        {s.shipping.freeEnabled && (
          <div className="admin-form-grid">
            <Field label="Free shipping when order (after discount) is at least (Rs.)">
              <input className="form-input" type="number" min="0" value={s.shipping.freeThreshold} onChange={(e) => set(['shipping', 'freeThreshold'], e.target.value)} />
            </Field>
          </div>
        )}

        <h3 className="admin-subtitle">Delivery zones by city <small>(optional)</small></h3>
        <p className="admin-hint">Give different cities a different charge or delivery time. Cities not listed use the standard charge.</p>
        {s.shipping.zones.length > 0 && (
          <div className="admin-zones">
            <div className="admin-zone-row admin-zone-row--head">
              <span>Zone name</span><span>Cities (comma separated)</span><span>Charge (Rs.)</span><span>Free above (Rs.)</span><span>Delivery time</span><span />
            </div>
            {s.shipping.zones.map((z, i) => (
              <div key={z.id || i} className="admin-zone-row">
                <input className="form-input" value={z.name} onChange={(e) => setZone(i, 'name', e.target.value)} placeholder="Lahore" />
                <input className="form-input" value={z.cities} onChange={(e) => setZone(i, 'cities', e.target.value)} placeholder="lahore, kasur" />
                <input className="form-input" type="number" min="0" value={z.fee} onChange={(e) => setZone(i, 'fee', e.target.value)} />
                <input className="form-input" type="number" min="0" value={z.freeThreshold} onChange={(e) => setZone(i, 'freeThreshold', e.target.value)} placeholder="store default" />
                <input className="form-input" value={z.eta} onChange={(e) => setZone(i, 'eta', e.target.value)} placeholder="1-2 business days" />
                <button type="button" className="btn admin-table__btn-sm admin-table__btn-danger" onClick={() => removeZone(i)} aria-label="Remove zone">Remove</button>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn--secondary" onClick={addZone}>+ Add delivery zone</button>
      </div>

      {/* ───────────── Tax ───────────── */}
      <div className="admin-panel">
        <h2 className="admin-panel__title">Tax</h2>
        <Toggle checked={s.tax.enabled} onChange={(v) => set(['tax', 'enabled'], v)} label="Charge tax on orders" />
        {s.tax.enabled && (
          <>
            <div className="admin-form-grid">
              <Field label="Tax rate (%)" hint="Individual products can override this in Inventory.">
                <input className="form-input" type="number" min="0" max="100" step="0.01" value={s.tax.rate} onChange={(e) => set(['tax', 'rate'], e.target.value)} />
              </Field>
              <Field label="Tax name shown to customers">
                <input className="form-input" value={s.tax.label} maxLength={30} onChange={(e) => set(['tax', 'label'], e.target.value)} placeholder="GST" />
              </Field>
            </div>
            <Toggle checked={s.tax.inclusive} onChange={(v) => set(['tax', 'inclusive'], v)} label="Product prices already include tax" hint="If on, tax is shown as a breakdown but NOT added on top." />
            <Toggle checked={s.tax.onShipping} onChange={(v) => set(['tax', 'onShipping'], v)} label="Also charge tax on the shipping fee" />
          </>
        )}
      </div>

      {/* ───────────── Payment ───────────── */}
      <div className="admin-panel">
        <h2 className="admin-panel__title">Payment</h2>
        <Toggle checked={s.payment.codEnabled} onChange={(v) => set(['payment', 'codEnabled'], v)} label="Cash on Delivery" />
        {s.payment.codEnabled && (
          <div className="admin-form-grid">
            <Field label="COD handling fee (Rs.)" hint="0 = free.">
              <input className="form-input" type="number" min="0" value={s.payment.codFee} onChange={(e) => set(['payment', 'codFee'], e.target.value)} />
            </Field>
          </div>
        )}
        <Toggle checked={s.payment.bankTransferEnabled} onChange={(v) => set(['payment', 'bankTransferEnabled'], v)} label="Bank transfer" />
        {s.payment.bankTransferEnabled && (
          <Field label="Bank details / instructions shown at checkout">
            <textarea className="form-input form-textarea" rows={3} maxLength={1000} value={s.payment.bankInstructions} onChange={(e) => set(['payment', 'bankInstructions'], e.target.value)} placeholder="Bank name, account title, account number / IBAN…" />
          </Field>
        )}
        {!s.payment.codEnabled && !s.payment.bankTransferEnabled && <p className="coupon-box__error">Enable at least one payment method or customers cannot check out.</p>}
      </div>

      {/* ───────────── Live preview ───────────── */}
      <div className="admin-panel admin-preview">
        <h2 className="admin-panel__title">Live preview (uses the values above, even before saving)</h2>
        <div className="admin-form-grid">
          <Field label="Sample order amount (Rs.)"><input className="form-input" type="number" min="0" value={preview.amount} onChange={(e) => setPreview({ ...preview, amount: e.target.value })} /></Field>
          <Field label="Customer city"><input className="form-input" value={preview.city} onChange={(e) => setPreview({ ...preview, city: e.target.value })} /></Field>
          <Field label="Payment">
            <select className="form-input" value={preview.payment} onChange={(e) => setPreview({ ...preview, payment: e.target.value })}>
              <option value="cod">Cash on Delivery</option>
              <option value="bank">Bank transfer</option>
            </select>
          </Field>
        </div>
        {sample && (
          <table className="admin-table admin-preview__table">
            <tbody>
              <tr><td>Subtotal</td><td>{formatPrice(sample.subtotal)}</td></tr>
              <tr><td>Shipping{sample.zoneName ? ` (${sample.zoneName})` : ''}</td><td>{sample.shippingFree ? 'Free' : formatPrice(sample.shipping)}</td></tr>
              {sample.taxEnabled && <tr><td>{sample.taxLabel}{sample.taxInclusive ? ' (included)' : ''}</td><td>{formatPrice(sample.tax)}</td></tr>}
              {sample.codFee > 0 && <tr><td>COD fee</td><td>{formatPrice(sample.codFee)}</td></tr>}
              <tr className="admin-preview__total"><td>Customer pays</td><td>{formatPrice(sample.total)}</td></tr>
            </tbody>
          </table>
        )}
        {sample?.minOrderProblem && <p className="coupon-box__error">{sample.minOrderProblem}</p>}
      </div>

      {/* ───────────── Store info ───────────── */}
      <div className="admin-panel">
        <h2 className="admin-panel__title">Store information</h2>
        <p className="admin-hint">Shown in the footer, contact page, WhatsApp button and policy pages. Leave a field empty to hide it.</p>
        <div className="admin-form-grid">
          <Field label="Store name"><input className="form-input" value={s.store.name} maxLength={80} onChange={(e) => set(['store', 'name'], e.target.value)} /></Field>
          <Field label="Phone"><input className="form-input" value={s.store.phone} maxLength={40} onChange={(e) => set(['store', 'phone'], e.target.value)} placeholder="+92 300 1234567" /></Field>
          <Field label="WhatsApp number" hint="Digits only or with +92; used for the WhatsApp buttons."><input className="form-input" value={s.store.whatsapp} maxLength={40} onChange={(e) => set(['store', 'whatsapp'], e.target.value)} /></Field>
          <Field label="Email"><input className="form-input" type="email" value={s.store.email} maxLength={120} onChange={(e) => set(['store', 'email'], e.target.value)} /></Field>
          <Field label="Address"><input className="form-input" value={s.store.address} maxLength={240} onChange={(e) => set(['store', 'address'], e.target.value)} /></Field>
          <Field label="Opening hours"><input className="form-input" value={s.store.hours} maxLength={200} onChange={(e) => set(['store', 'hours'], e.target.value)} placeholder="Mon-Sat 10am-8pm" /></Field>
          <Field label="Facebook page URL"><input className="form-input" value={s.store.facebook} maxLength={200} onChange={(e) => set(['store', 'facebook'], e.target.value)} placeholder="https://facebook.com/..." /></Field>
          <Field label="Instagram URL"><input className="form-input" value={s.store.instagram} maxLength={200} onChange={(e) => set(['store', 'instagram'], e.target.value)} placeholder="https://instagram.com/..." /></Field>
        </div>
      </div>

      {/* ───────────── Announcement ───────────── */}
      <div className="admin-panel">
        <h2 className="admin-panel__title">Announcement bar</h2>
        <Toggle checked={s.announcement.enabled} onChange={(v) => set(['announcement', 'enabled'], v)} label="Show the scrolling announcement bar" />
        <Field label="Messages (one per line, max 6)">
          <textarea className="form-input form-textarea" rows={4} value={s.announcement.messagesText} onChange={(e) => set(['announcement', 'messagesText'], e.target.value)} placeholder={'10% off with code SAVE10\nFree shipping over Rs. 5,000'} />
        </Field>
      </div>

      <div className="admin-settings__save">
        <button className="btn btn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save all changes'}</button>
      </div>
    </div>
  );
}
