// Unit tests for lib/pricing.js + lib/settings.js normalisation.
// Run:  npm run test:pricing
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(join(tmpdir(), 'pricing-'));

// copy the ESM source to a .mjs file so this works on every Node version
const load = async (rel, patch = (s) => s) => {
  const out = join(tmp, rel.replace(/[\\/]/g, '_').replace(/\.js$/, '.mjs'));
  writeFileSync(out, patch(readFileSync(join(root, rel), 'utf8')));
  return import(pathToFileURL(out).href);
};
const pricing = await load('lib/pricing.js');
// settings.js imports './db' (needs DB) - only test the pure normaliser
const settingsSrc = readFileSync(join(root, 'lib/settings.js'), 'utf8').replace(/^import sql from '\.\/db';\n/m, 'const sql = null;\n');
const sOut = join(tmp, 'settings.mjs');
writeFileSync(sOut, settingsSrc);
const settingsMod = await import(pathToFileURL(sOut).href);

const { computePricing, normalizeCoupon } = pricing;
const { normalizeSettings } = settingsMod;
const S = (over = {}) => normalizeSettings(over);
const item = (price, quantity = 1, extra = {}) => ({ id: String(price), name: 'x', price, quantity, ...extra });

let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log('  ok  -', name); };

t('subtotal and default shipping below threshold', () => {
  const r = computePricing({ items: [item(1000, 2)], settings: S() });
  assert.equal(r.subtotal, 2000); assert.equal(r.shipping, 250); assert.equal(r.total, 2250);
  assert.equal(r.freeShippingRemaining, 3000);
});
t('free shipping at/above threshold', () => {
  const r = computePricing({ items: [item(5000)], settings: S() });
  assert.equal(r.shipping, 0); assert.equal(r.freeReason, 'threshold'); assert.equal(r.total, 5000);
});
t('free shipping switched off -> always charged', () => {
  const r = computePricing({ items: [item(9000)], settings: S({ shipping: { freeEnabled: false } }) });
  assert.equal(r.shipping, 250);
});
t('shipping disabled entirely', () => {
  const r = computePricing({ items: [item(100)], settings: S({ shipping: { enabled: false } }) });
  assert.equal(r.shipping, 0); assert.equal(r.total, 100);
});
t('zone fee by city (case-insensitive) + zone threshold', () => {
  const settings = S({ shipping: { zones: [{ id: 'l', name: 'Lahore', cities: ['Lahore'], fee: 150, freeThreshold: 2000 }] } });
  const a = computePricing({ items: [item(1000)], settings, city: ' LAHORE ' });
  assert.equal(a.shipping, 150); assert.equal(a.zoneName, 'Lahore');
  const b = computePricing({ items: [item(2000)], settings, city: 'lahore' });
  assert.equal(b.shipping, 0);
  const c = computePricing({ items: [item(1000)], settings, city: 'karachi' });
  assert.equal(c.shipping, 250);
});
t('all items flagged free_shipping -> free', () => {
  const r = computePricing({ items: [item(500, 1, { freeShipping: true })], settings: S() });
  assert.equal(r.shipping, 0); assert.equal(r.freeReason, 'product');
});
t('mixed cart with one non-free item is charged', () => {
  const r = computePricing({ items: [item(500, 1, { freeShipping: true }), item(500)], settings: S() });
  assert.equal(r.shipping, 250);
});
t('percent coupon reduces subtotal and can cross the free-shipping threshold check on discounted amount', () => {
  const c = normalizeCoupon({ code: 'save10', discount_type: 'percent', discount_value: 10 });
  const r = computePricing({ items: [item(5000)], settings: S(), coupon: c });
  assert.equal(r.discount, 500); assert.equal(r.taxable, 4500);
  assert.equal(r.shipping, 250); // 4500 < 5000 threshold
  assert.equal(r.total, 4750);
});
t('flat coupon capped at subtotal', () => {
  const c = normalizeCoupon({ code: 'BIG', discount_type: 'flat', discount_value: 99999 });
  const r = computePricing({ items: [item(300)], settings: S({ shipping: { enabled: false } }), coupon: c });
  assert.equal(r.discount, 300); assert.equal(r.total, 0);
});
t('coupon min order / expiry / inactive / max uses are rejected', () => {
  const base = { code: 'X', discount_type: 'percent', discount_value: 10 };
  const min = computePricing({ items: [item(100)], settings: S(), coupon: normalizeCoupon({ ...base, min_order_amount: 1000 }) });
  assert.ok(min.couponError && min.discount === 0);
  const exp = computePricing({ items: [item(100)], settings: S(), coupon: normalizeCoupon({ ...base, expires_at: '2020-01-01' }) });
  assert.match(exp.couponError, /expired/);
  const off = computePricing({ items: [item(100)], settings: S(), coupon: normalizeCoupon({ ...base, active: false }) });
  assert.match(off.couponError, /no longer active/);
  const used = computePricing({ items: [item(100)], settings: S(), coupon: normalizeCoupon({ ...base, max_uses: 2, used_count: 2 }) });
  assert.match(used.couponError, /usage limit/);
});
t('free-shipping coupon', () => {
  const c = normalizeCoupon({ code: 'SHIPFREE', discount_type: 'free_shipping', discount_value: 0 });
  const r = computePricing({ items: [item(100)], settings: S(), coupon: c });
  assert.equal(r.shipping, 0); assert.equal(r.freeReason, 'coupon');
});
t('tax exclusive is added to total', () => {
  const r = computePricing({ items: [item(1000)], settings: S({ shipping: { enabled: false }, tax: { enabled: true, rate: 18 } }) });
  assert.equal(r.tax, 180); assert.equal(r.total, 1180);
});
t('tax inclusive is shown but not added', () => {
  const r = computePricing({ items: [item(1180)], settings: S({ shipping: { enabled: false }, tax: { enabled: true, rate: 18, inclusive: true } }) });
  assert.equal(r.tax, 180); assert.equal(r.total, 1180);
});
t('per-product tax override (0 = exempt)', () => {
  const r = computePricing({
    items: [item(1000, 1, { taxRate: 0 }), item(1000)],
    settings: S({ shipping: { enabled: false }, tax: { enabled: true, rate: 10 } }),
  });
  assert.equal(r.tax, 100); assert.equal(r.total, 2100);
});
t('tax is computed after discount', () => {
  const c = normalizeCoupon({ code: 'H', discount_type: 'percent', discount_value: 50 });
  const r = computePricing({ items: [item(1000)], settings: S({ shipping: { enabled: false }, tax: { enabled: true, rate: 10 } }), coupon: c });
  assert.equal(r.tax, 50); assert.equal(r.total, 550);
});
t('COD fee only for COD', () => {
  const s = S({ shipping: { enabled: false }, payment: { codFee: 100 } });
  assert.equal(computePricing({ items: [item(1000)], settings: s, paymentMethod: 'cod' }).total, 1100);
  assert.equal(computePricing({ items: [item(1000)], settings: s, paymentMethod: 'bank' }).total, 1000);
});
t('minimum order problem reported', () => {
  const r = computePricing({ items: [item(100)], settings: S({ shipping: { minOrder: 500 } }) });
  assert.ok(r.minOrderProblem);
});
t('empty / garbage input never throws', () => {
  const r = computePricing({ items: [{ price: 'abc', quantity: -3 }, null && {}].filter(Boolean), settings: S() });
  assert.equal(r.total, 0);
  const r2 = computePricing({ items: undefined, settings: S() });
  assert.equal(r2.total, 0);
});
t('float rounding stays 2dp', () => {
  const r = computePricing({ items: [item(19.99, 3)], settings: S({ shipping: { enabled: false } }) });
  assert.equal(r.subtotal, 59.97);
});
t('normalizeSettings clamps bad values', () => {
  const s = normalizeSettings({ tax: { rate: 999 }, shipping: { defaultFee: -5, zones: [{ cities: 'Lahore, Karachi', fee: '300' }] } });
  assert.equal(s.tax.rate, 100); assert.equal(s.shipping.defaultFee, 0);
  assert.deepEqual(s.shipping.zones[0].cities, ['lahore', 'karachi']); assert.equal(s.shipping.zones[0].fee, 300);
});

console.log(`\nAll ${passed} pricing tests passed.`);
