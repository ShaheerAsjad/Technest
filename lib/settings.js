import sql from './db';

/**
 * Store settings live in ONE row (store_settings.id = 1, JSON in `data`).
 * The admin edits them at /admin/settings. Everything is merged over
 * DEFAULT_SETTINGS and normalised, so a missing / broken row can never
 * crash the storefront.
 */
export const DEFAULT_SETTINGS = {
  currency: 'PKR',
  store: {
    name: 'TechNest',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    hours: '',
    facebook: '',
    instagram: '',
  },
  announcement: {
    enabled: true,
    messages: [
      'Free shipping on orders over Rs. 5,000',
      'Cash on Delivery available across Pakistan',
    ],
  },
  shipping: {
    enabled: true,
    defaultFee: 250,
    freeEnabled: true,
    freeThreshold: 5000,
    minOrder: 0,
    etaText: '2-5 business days',
    zones: [
      // { id, name, cities: ['lahore'], fee: 200, freeThreshold: null | number, eta: '1-2 business days' }
    ],
  },
  tax: {
    enabled: false,
    rate: 0,
    label: 'GST',
    inclusive: false,
    onShipping: false,
  },
  payment: {
    codEnabled: true,
    codFee: 0,
    bankTransferEnabled: false,
    bankInstructions: '',
  },
};

const num = (v, fallback, min = 0, max = 100000000) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};
const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);
const str = (v, fallback = '', max = 500) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : fallback;

/** Merge + validate arbitrary input into a safe settings object. */
export function normalizeSettings(input = {}) {
  const d = DEFAULT_SETTINGS;
  const i = input && typeof input === 'object' ? input : {};
  const st = i.store || {};
  const an = i.announcement || {};
  const sh = i.shipping || {};
  const tx = i.tax || {};
  const py = i.payment || {};

  const messages = Array.isArray(an.messages)
    ? an.messages.map((m) => str(m, '', 160)).filter(Boolean).slice(0, 6)
    : d.announcement.messages;

  const zones = Array.isArray(sh.zones)
    ? sh.zones.slice(0, 30).map((z, idx) => ({
        id: str(z?.id, `zone-${idx + 1}`, 40) || `zone-${idx + 1}`,
        name: str(z?.name, `Zone ${idx + 1}`, 60) || `Zone ${idx + 1}`,
        cities: (Array.isArray(z?.cities)
          ? z.cities
          : String(z?.cities || '').split(',')
        ).map((c) => String(c).trim().toLowerCase()).filter(Boolean).slice(0, 200),
        fee: num(z?.fee, 0),
        freeThreshold:
          z?.freeThreshold === null || z?.freeThreshold === '' || z?.freeThreshold === undefined
            ? null
            : num(z.freeThreshold, null),
        eta: str(z?.eta, '', 60),
      }))
    : [];

  return {
    currency: 'PKR',
    store: {
      name: str(st.name, d.store.name, 80) || d.store.name,
      phone: str(st.phone, '', 40),
      whatsapp: str(st.whatsapp, '', 40),
      email: str(st.email, '', 120),
      address: str(st.address, '', 240),
      hours: str(st.hours, '', 200),
      facebook: str(st.facebook, '', 200),
      instagram: str(st.instagram, '', 200),
    },
    announcement: {
      enabled: bool(an.enabled, d.announcement.enabled),
      messages: messages.length ? messages : d.announcement.messages,
    },
    shipping: {
      enabled: bool(sh.enabled, d.shipping.enabled),
      defaultFee: num(sh.defaultFee, d.shipping.defaultFee),
      freeEnabled: bool(sh.freeEnabled, d.shipping.freeEnabled),
      freeThreshold: num(sh.freeThreshold, d.shipping.freeThreshold),
      minOrder: num(sh.minOrder, 0),
      etaText: str(sh.etaText, d.shipping.etaText, 80),
      zones,
    },
    tax: {
      enabled: bool(tx.enabled, d.tax.enabled),
      rate: num(tx.rate, 0, 0, 100),
      label: str(tx.label, d.tax.label, 30) || d.tax.label,
      inclusive: bool(tx.inclusive, d.tax.inclusive),
      onShipping: bool(tx.onShipping, d.tax.onShipping),
    },
    payment: {
      codEnabled: bool(py.codEnabled, d.payment.codEnabled),
      codFee: num(py.codFee, 0),
      bankTransferEnabled: bool(py.bankTransferEnabled, d.payment.bankTransferEnabled),
      bankInstructions: str(py.bankInstructions, '', 1000),
    },
  };
}

let cache = { at: 0, value: null };
const TTL_MS = 20 * 1000;

export function invalidateSettingsCache() {
  cache = { at: 0, value: null };
}

/** Always resolves (falls back to defaults if the table/row is missing). */
export async function getStoreSettings({ fresh = false } = {}) {
  const now = Date.now();
  if (!fresh && cache.value && now - cache.at < TTL_MS) return cache.value;
  try {
    const rows = await sql`SELECT data FROM store_settings WHERE id = 1`;
    const data = rows?.[0]?.data;
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    const value = normalizeSettings(parsed || {});
    cache = { at: now, value };
    return value;
  } catch (err) {
    console.warn('[settings] using defaults:', err?.message);
    const value = normalizeSettings({});
    cache = { at: now - TTL_MS + 5000, value }; // retry sooner after a failure
    return value;
  }
}

export async function saveStoreSettings(input, userId = null) {
  const value = normalizeSettings(input);
  await sql`
    INSERT INTO store_settings (id, data, updated_at, updated_by)
    VALUES (1, ${JSON.stringify(value)}::jsonb, NOW(), ${userId})
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = NOW(), updated_by = EXCLUDED.updated_by
  `;
  invalidateSettingsCache();
  return value;
}

/** Subset that is safe to send to any browser. */
export function publicSettings(s) {
  return {
    store: s.store,
    announcement: s.announcement,
    shipping: {
      enabled: s.shipping.enabled,
      freeEnabled: s.shipping.freeEnabled,
      freeThreshold: s.shipping.freeThreshold,
      defaultFee: s.shipping.defaultFee,
      etaText: s.shipping.etaText,
      zones: s.shipping.zones.map((z) => ({
        id: z.id, name: z.name, cities: z.cities, fee: z.fee, eta: z.eta,
        freeThreshold: z.freeThreshold,
      })),
    },
    tax: { enabled: s.tax.enabled, rate: s.tax.rate, label: s.tax.label, inclusive: s.tax.inclusive },
    payment: {
      codEnabled: s.payment.codEnabled,
      codFee: s.payment.codFee,
      bankTransferEnabled: s.payment.bankTransferEnabled,
      bankInstructions: s.payment.bankInstructions,
    },
  };
}
