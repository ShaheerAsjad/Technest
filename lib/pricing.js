/**
 * Pure pricing engine (no imports, no I/O) so it can be unit-tested and used
 * identically by the cart preview API and the checkout API.
 *
 *  subtotal  = sum(price * qty)
 *  discount  = coupon (percent / flat), capped at subtotal
 *  taxable   = subtotal - discount
 *  shipping  = 0 if free (coupon | every item free | threshold reached) else zone fee / default fee
 *  tax       = per-item rate (product override, else global) on the discounted amount
 *  codFee    = only if paying by COD
 *  total     = taxable + shipping + tax(if exclusive) + codFee
 */

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const norm = (s) => String(s ?? '').trim().toLowerCase();

export function findZone(settings, city) {
  const c = norm(city);
  if (!c) return null;
  const zones = settings?.shipping?.zones || [];
  for (const z of zones) {
    if ((z.cities || []).map(norm).includes(c)) return z;
  }
  return null;
}

/** Normalise a coupon row from the DB into the shape used below. */
export function normalizeCoupon(row) {
  if (!row) return null;
  const type = norm(row.discount_type ?? row.discountType);
  const isPercent = type.startsWith('perc') || type === '%';
  const isFree = type === 'free_shipping' || row.free_shipping === true;
  return {
    code: String(row.code || '').toUpperCase(),
    kind: isFree ? 'free_shipping' : isPercent ? 'percent' : 'flat',
    value: Number(row.discount_value ?? row.discountValue) || 0,
    minOrder: Number(row.min_order_amount ?? row.minOrder) || 0,
    maxUses: row.max_uses === null || row.max_uses === undefined ? null : Number(row.max_uses),
    usedCount: Number(row.used_count) || 0,
    isActive: (() => { const v = row.active ?? row.is_active; return v === undefined || v === null ? true : Boolean(v); })(),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    freeShipping: isFree || row.free_shipping === true,
  };
}

/** Returns an error string, or null when the coupon can be applied. */
export function couponProblem(coupon, subtotal, now = new Date()) {
  if (!coupon) return 'Invalid coupon code.';
  if (!coupon.isActive) return 'This coupon is no longer active.';
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) return 'This coupon has expired.';
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return 'This coupon has reached its usage limit.';
  if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
    return `Add items worth Rs. ${Math.ceil(coupon.minOrder - subtotal).toLocaleString('en-US')} more to use this coupon.`;
  }
  return null;
}

/**
 * @param {object} args
 * @param {Array<{id,name,price,quantity,taxRate?:number|null,freeShipping?:boolean}>} args.items
 * @param {object} args.settings  normalised store settings
 * @param {string} [args.city]
 * @param {object|null} [args.coupon]  result of normalizeCoupon()
 * @param {string} [args.paymentMethod] 'cod' | 'bank'
 */
export function computePricing({ items, settings, city = '', coupon = null, paymentMethod = 'cod' }) {
  const warnings = [];
  const safeItems = (items || [])
    .map((it) => ({
      ...it,
      price: Math.max(0, Number(it.price) || 0),
      quantity: Math.max(0, Math.floor(Number(it.quantity) || 0)),
    }))
    .filter((it) => it.quantity > 0);

  const subtotal = round2(safeItems.reduce((s, it) => s + it.price * it.quantity, 0));

  // ---- coupon ------------------------------------------------------------
  let discount = 0;
  let couponApplied = null;
  let couponError = null;
  if (coupon) {
    couponError = couponProblem(coupon, subtotal);
    if (!couponError) {
      couponApplied = coupon.code;
      if (coupon.kind === 'percent') discount = subtotal * (Math.min(coupon.value, 100) / 100);
      else if (coupon.kind === 'flat') discount = coupon.value;
      discount = round2(Math.min(Math.max(discount, 0), subtotal));
    }
  }
  const taxable = round2(subtotal - discount);

  // ---- shipping ----------------------------------------------------------
  const sh = settings.shipping;
  const zone = findZone(settings, city);
  let shipping = 0;
  let shippingFree = false;
  let freeReason = null;
  let freeShippingRemaining = null;

  if (safeItems.length === 0) {
    shipping = 0;
  } else if (!sh.enabled) {
    shippingFree = true;
    freeReason = 'disabled';
  } else {
    const threshold =
      zone && zone.freeThreshold !== null && zone.freeThreshold !== undefined
        ? zone.freeThreshold
        : sh.freeThreshold;
    const allItemsFree = safeItems.every((it) => it.freeShipping === true);

    if (couponApplied && coupon.freeShipping) {
      shippingFree = true; freeReason = 'coupon';
    } else if (allItemsFree) {
      shippingFree = true; freeReason = 'product';
    } else if (sh.freeEnabled && threshold > 0 && taxable >= threshold) {
      shippingFree = true; freeReason = 'threshold';
    }
    if (sh.freeEnabled && threshold > 0 && !shippingFree) {
      freeShippingRemaining = round2(threshold - taxable);
    }
    shipping = shippingFree ? 0 : round2(zone ? zone.fee : sh.defaultFee);
  }

  // ---- tax ---------------------------------------------------------------
  const tx = settings.tax;
  let tax = 0;
  if (tx.enabled && subtotal > 0) {
    const ratio = subtotal > 0 ? taxable / subtotal : 0;
    for (const it of safeItems) {
      const rate = it.taxRate === null || it.taxRate === undefined ? tx.rate : Number(it.taxRate);
      const r = Math.max(0, Math.min(100, Number.isFinite(rate) ? rate : 0)) / 100;
      const base = it.price * it.quantity * ratio;
      tax += tx.inclusive ? base - base / (1 + r) : base * r;
    }
    if (tx.onShipping && shipping > 0) {
      const r = tx.rate / 100;
      tax += tx.inclusive ? shipping - shipping / (1 + r) : shipping * r;
    }
    tax = round2(tax);
  }

  // ---- payment fee -------------------------------------------------------
  const py = settings.payment;
  const codFee = paymentMethod === 'cod' && py.codEnabled && safeItems.length > 0 ? round2(py.codFee) : 0;

  // ---- minimum order -----------------------------------------------------
  let minOrderProblem = null;
  if (sh.minOrder > 0 && subtotal > 0 && subtotal < sh.minOrder) {
    minOrderProblem = `Minimum order amount is Rs. ${sh.minOrder.toLocaleString('en-US')}.`;
  }

  const taxAdded = tx.enabled && !tx.inclusive ? tax : 0;
  const total = round2(taxable + shipping + taxAdded + codFee);

  return {
    items: safeItems,
    subtotal,
    discount,
    couponCode: couponApplied,
    couponError,
    taxable,
    shipping,
    shippingFree,
    freeReason,
    freeShippingRemaining,
    zoneName: zone ? zone.name : null,
    eta: zone?.eta || sh.etaText || '',
    tax,
    taxLabel: tx.label,
    taxInclusive: Boolean(tx.inclusive),
    taxEnabled: Boolean(tx.enabled),
    codFee,
    total,
    minOrderProblem,
    warnings,
  };
}
