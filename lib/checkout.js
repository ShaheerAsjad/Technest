import sql, { readQuery, writeQuery } from './db';
import { getProductsByIds } from './catalog';
import { normalizeCoupon } from './pricing';

const MAX_QTY = 99;

/** Sanitise client cart -> [{ id:number, quantity:number }] (merged, capped). */
export function sanitizeCartInput(input) {
  const map = new Map();
  for (const raw of Array.isArray(input) ? input.slice(0, 60) : []) {
    const id = parseInt(raw?.id ?? raw?.productId, 10);
    const qty = Math.floor(Number(raw?.quantity ?? raw?.qty ?? 1));
    if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(qty) || qty <= 0) continue;
    map.set(id, Math.min(MAX_QTY, (map.get(id) || 0) + qty));
  }
  return [...map.entries()].map(([id, quantity]) => ({ id, quantity }));
}

/**
 * Loads authoritative product data (price, stock, tax, shipping flag) for a cart.
 * `clip: true`  -> quantities are reduced to available stock (cart preview)
 * `clip: false` -> insufficient stock is reported as a problem (checkout)
 */
export async function loadCartLines(input, { clip = false } = {}) {
  const cart = sanitizeCartInput(input);
  const products = await getProductsByIds(cart.map((c) => c.id));
  const byId = new Map(products.map((p) => [Number(p.id), p]));
  const lines = [];
  const problems = [];
  const warnings = [];

  for (const c of cart) {
    const p = byId.get(c.id);
    if (!p || p.isArchived) {
      problems.push({ id: c.id, message: 'An item in your cart is no longer available.' });
      continue;
    }
    if (p.stock <= 0) {
      problems.push({ id: c.id, message: `"${p.name}" is out of stock.` });
      continue;
    }
    let quantity = c.quantity;
    if (quantity > p.stock) {
      if (clip) {
        warnings.push(`Only ${p.stock} of "${p.name}" available - quantity adjusted.`);
        quantity = p.stock;
      } else {
        problems.push({ id: c.id, message: `Only ${p.stock} of "${p.name}" left in stock.` });
        continue;
      }
    }
    lines.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      image: p.image,
      price: p.price,
      quantity,
      stock: p.stock,
      taxRate: p.taxRate,
      freeShipping: p.freeShipping,
    });
  }
  return { lines, problems, warnings };
}

export async function findCouponByCode(code) {
  const c = String(code || '').trim().toUpperCase().slice(0, 50);
  if (!c) return { coupon: null, error: null };
  try {
    const rows = await readQuery(`SELECT * FROM coupons WHERE UPPER(code) = $1 LIMIT 1`, [c]);
    if (!rows[0]) return { coupon: null, error: 'Invalid coupon code.' };
    return { coupon: normalizeCoupon(rows[0]), error: null };
  } catch (err) {
    console.error('[checkout] coupon lookup failed:', err?.message);
    return { coupon: null, error: 'Coupons are unavailable right now.' };
  }
}

const valuesClause = (lines) => lines.map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::int)`).join(',');
const valuesParams = (lines) => lines.flatMap((l) => [Number(l.id), Number(l.quantity)]);

/** Atomically subtract stock for every line. Returns ids that were reserved. */
export async function reserveStock(lines) {
  if (!lines.length) return { ok: true, reserved: [] };
  const rows = await writeQuery(
    `UPDATE products p SET stock = p.stock - v.qty
       FROM (VALUES ${valuesClause(lines)}) AS v(id, qty)
      WHERE p.id = v.id AND p.stock >= v.qty AND COALESCE(p.is_archived, false) = false
  RETURNING p.id`,
    valuesParams(lines)
  );
  const reserved = rows.map((r) => Number(r.id));
  return { ok: reserved.length === lines.length, reserved };
}

/** Give stock back (for the given product ids only). */
export async function releaseStock(lines, onlyIds = null) {
  const list = onlyIds ? lines.filter((l) => onlyIds.includes(Number(l.id))) : lines;
  if (!list.length) return;
  await writeQuery(
    `UPDATE products p SET stock = p.stock + v.qty
       FROM (VALUES ${valuesClause(list)}) AS v(id, qty)
      WHERE p.id = v.id`,
    valuesParams(list)
  );
}

export const PAYMENT_LABELS = { cod: 'Cash on Delivery', bank: 'Bank Transfer' };

export { sql };
