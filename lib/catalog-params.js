// Pure helpers (safe on server AND client): parse / build catalogue URL filters.
import { clampInt } from './validators';

const first = (obj, k) => {
  const v = obj?.[k];
  return Array.isArray(v) ? v[0] : v;
};

/** obj: plain object (Next searchParams) -> normalised filter object */
export function parseFilters(obj = {}) {
  const num = (k) => {
    const v = first(obj, k);
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const str = (k, max = 80) => {
    const v = first(obj, k);
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  };
  const brands = str('brand', 400)
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean)
    .slice(0, 12);
  const stockRaw = str('stock', 10);
  const sortRaw = str('sort', 20);
  return {
    q: str('q', 80),
    brands,
    minPrice: num('min'),
    maxPrice: num('max'),
    minRating: num('rating'),
    stock: stockRaw === 'in' || stockRaw === 'out' ? stockRaw : undefined,
    sort: ['latest', 'featured', 'price_asc', 'price_desc', 'name'].includes(sortRaw) ? sortRaw : 'latest',
    page: clampInt(first(obj, 'page'), 1, 10000, 1),
    onSale: str('sale', 5) === '1',
    category: str('category', 120),
    department: ['networking', 'consumer'].includes(str('dept', 20)) ? str('dept', 20) : '',
  };
}

export function searchParamsToObject(sp) {
  const o = {};
  for (const [k, v] of sp.entries()) if (!(k in o)) o[k] = v;
  return o;
}

/** Build a query string from a filter-ish object, dropping defaults. */
export function toQueryString(f = {}) {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.brands?.length) sp.set('brand', f.brands.join(','));
  if (f.minPrice !== undefined) sp.set('min', String(f.minPrice));
  if (f.maxPrice !== undefined) sp.set('max', String(f.maxPrice));
  if (f.minRating) sp.set('rating', String(f.minRating));
  if (f.stock) sp.set('stock', f.stock);
  if (f.sort && f.sort !== 'latest') sp.set('sort', f.sort);
  if (f.page && f.page > 1) sp.set('page', String(f.page));
  if (f.onSale) sp.set('sale', '1');
  if (f.category) sp.set('category', f.category);
  if (f.department) sp.set('dept', f.department);
  const s = sp.toString();
  return s ? `?${s}` : '';
}
