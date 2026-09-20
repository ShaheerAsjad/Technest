import { unstable_cache } from 'next/cache';
import { readQuery } from './db';
import { clampInt } from './validators';

/* ─────────────────────────────────────────────────────────────────────────
   Server-side catalogue queries (products, categories, brands, search).
   All SQL is parameterised; sort keys come from a whitelist.
   ───────────────────────────────────────────────────────────────────────── */

const PRODUCT_SELECT = `
  p.id, p.title, p.description, p.price, p.stock, p.image, p.images,
  p.original_price, p.is_on_sale, p.is_featured, p.is_archived,
  p.sku, p.slug, p.brand, p.specs, p.free_shipping, p.tax_rate, p.category_id,
  c.name AS category, c.slug AS category_slug, c.department AS department,
  COALESCE(r.avg_rating, 0) AS rating, COALESCE(r.review_count, 0) AS review_count
`;

const PRODUCT_FROM = `
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN (
    SELECT product_id, AVG(rating)::float AS avg_rating, COUNT(*)::int AS review_count
    FROM reviews GROUP BY product_id
  ) r ON r.product_id = p.id
`;

const SORTS = {
  latest: 'p.id DESC',
  price_asc: 'p.price ASC, p.id DESC',
  price_desc: 'p.price DESC, p.id DESC',
  name: 'p.title ASC, p.id DESC',
  featured: 'p.is_featured DESC NULLS LAST, p.id DESC',
};
export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

const esc = (s) => String(s).replace(/[\\%_]/g, (m) => `\\${m}`);

export function mapProduct(row) {
  if (!row) return null;
  const price = Number(row.price) || 0;
  const orig = row.original_price !== null && row.original_price !== undefined ? Number(row.original_price) : price;
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const primary = row.image || images[0] || '/placeholder.svg';
  const stock = Number(row.stock) || 0;
  const reviewCount = Number(row.review_count) || 0;
  return {
    id: String(row.id),
    slug: row.slug || String(row.id),
    name: row.title,
    title: row.title,
    description: row.description || '',
    price,
    originalPrice: orig > price ? orig : price,
    stock,
    isOutOfStock: stock <= 0,
    isOnSale: Boolean(row.is_on_sale) && orig > price,
    isFeatured: Boolean(row.is_featured),
    isArchived: Boolean(row.is_archived),
    category: row.category || 'General',
    categorySlug: row.category_slug || null,
    department: row.department || 'consumer',
    brand: row.brand || null,
    sku: row.sku || null,
    image: primary,
    images: images.length ? images : [primary],
    specs: row.specs && typeof row.specs === 'object' && !Array.isArray(row.specs) ? row.specs : {},
    freeShipping: Boolean(row.free_shipping),
    taxRate: row.tax_rate === null || row.tax_rate === undefined ? null : Number(row.tax_rate),
    rating: reviewCount > 0 ? Math.round(Number(row.rating) * 10) / 10 : null,
    reviewCount,
  };
}

/* ────────────────────────────── categories ─────────────────────────────── */

async function loadCategoryTree() {
  const rows = await readQuery(`
    SELECT c.id, c.name, c.slug, c.parent_id, c.department, c.image, c.sort_order,
           COUNT(p.id)::int AS own_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND COALESCE(p.is_archived, false) = false
    WHERE COALESCE(c.is_active, true) = true
    GROUP BY c.id, c.name, c.slug, c.parent_id, c.department, c.image, c.sort_order
    ORDER BY c.sort_order ASC, c.name ASC
  `);

  const flat = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    parentId: r.parent_id,
    department: r.department || 'consumer',
    image: r.image || null,
    sort: r.sort_order || 0,
    ownCount: r.own_count || 0,
    count: r.own_count || 0,
    children: [],
  }));
  const byId = new Map(flat.map((c) => [c.id, c]));
  const roots = [];
  for (const c of flat) {
    const parent = c.parentId ? byId.get(c.parentId) : null;
    if (parent && parent !== c) parent.children.push(c);
    else roots.push(c);
  }
  // roll counts up (children first); guard against cycles with a depth cap
  const roll = (node, depth = 0) => {
    if (depth > 6) return node.count;
    for (const ch of node.children) node.count += roll(ch, depth + 1);
    return node.count;
  };
  roots.forEach((r) => roll(r));

  // Hide empty categories from navigation (they stay editable in Admin and reachable by URL).
  const prune = (n) => { n.children = n.children.filter((ch) => ch.count > 0); n.children.forEach(prune); };
  roots.forEach(prune);
  const visibleRoots = roots.filter((r) => r.count > 0);

  const departments = {};
  for (const r of visibleRoots) (departments[r.department] ||= []).push(r);
  // return plain JSON-safe data (needed for unstable_cache)
  const strip = (n) => ({
    id: n.id, name: n.name, slug: n.slug, parentId: n.parentId, department: n.department,
    image: n.image, count: n.count, ownCount: n.ownCount, children: n.children.map(strip),
  });
  return {
    roots: visibleRoots.map(strip),
    departments: Object.fromEntries(Object.entries(departments).map(([k, v]) => [k, v.map(strip)])),
    flat: flat.map((n) => ({
      id: n.id, name: n.name, slug: n.slug, parentId: n.parentId, department: n.department,
      image: n.image, count: n.count, ownCount: n.ownCount,
    })),
  };
}

const cachedCategoryTree = unstable_cache(loadCategoryTree, ['category-tree-v1'], {
  revalidate: 120,
  tags: ['catalog'],
});

const EMPTY_TREE = { roots: [], departments: {}, flat: [] };

/** Never throws - the navbar must render even if the DB is down. */
export async function getCategoryTree() {
  try {
    return await cachedCategoryTree();
  } catch (err) {
    console.error('[catalog] category tree failed:', err?.message);
    return EMPTY_TREE;
  }
}

export function findCategory(tree, key) {
  if (!key) return null;
  const k = String(key).trim().toLowerCase();
  return (
    tree.flat.find((c) => c.slug === k) ||
    tree.flat.find((c) => c.name.toLowerCase() === k) ||
    null
  );
}

export function descendantIds(tree, id) {
  const out = new Set([id]);
  let grew = true;
  let guard = 0;
  while (grew && guard++ < 8) {
    grew = false;
    for (const c of tree.flat) {
      if (c.parentId && out.has(c.parentId) && !out.has(c.id)) { out.add(c.id); grew = true; }
    }
  }
  return [...out];
}

export function breadcrumbFor(tree, id) {
  const trail = [];
  let cur = tree.flat.find((c) => c.id === id);
  let guard = 0;
  while (cur && guard++ < 8) {
    trail.unshift(cur);
    cur = cur.parentId ? tree.flat.find((c) => c.id === cur.parentId) : null;
  }
  return trail;
}

/* ─────────────────────────────── products ──────────────────────────────── */

function buildWhere(f, params) {
  const where = [`COALESCE(p.is_archived, false) = false`];
  const add = (v) => { params.push(v); return `$${params.length}`; };

  if (f.categoryIds?.length) where.push(`p.category_id = ANY(${add(f.categoryIds)}::int[])`);
  if (f.department) where.push(`c.department = ${add(f.department)}`);
  if (f.brands?.length) where.push(`LOWER(p.brand) = ANY(${add(f.brands.map((b) => b.toLowerCase()))}::text[])`);
  if (Number.isFinite(f.minPrice)) where.push(`p.price >= ${add(f.minPrice)}`);
  if (Number.isFinite(f.maxPrice)) where.push(`p.price <= ${add(f.maxPrice)}`);
  if (Number.isFinite(f.minRating) && f.minRating > 0) where.push(`COALESCE(r.avg_rating, 0) >= ${add(f.minRating)}`);
  if (f.stock === 'in') where.push(`p.stock > 0`);
  if (f.stock === 'out') where.push(`p.stock <= 0`);
  if (f.onSale) where.push(`p.is_on_sale = true`);
  if (f.featured) where.push(`p.is_featured = true`);
  if (f.q) {
    const tokens = String(f.q).trim().split(/\s+/).filter(Boolean).slice(0, 6);
    for (const t of tokens) {
      const p1 = add(`%${esc(t)}%`);
      where.push(`(p.title ILIKE ${p1} OR p.sku ILIKE ${p1} OR p.brand ILIKE ${p1} OR c.name ILIKE ${p1})`);
    }
  }
  return where.join(' AND ');
}

/**
 * @param {object} f filters: categoryIds, department, brands[], minPrice, maxPrice, minRating,
 *                  stock('in'|'out'), onSale, featured, q, sort, page, pageSize
 */
export async function listProducts(f = {}) {
  const pageSize = clampInt(f.pageSize, 1, 60, 24);
  const page = clampInt(f.page, 1, 10000, 1);
  const params = [];
  const where = buildWhere(f, params);
  const order = SORTS[f.sort] || SORTS.latest;

  const countRows = await readQuery(`SELECT COUNT(*)::int AS n ${PRODUCT_FROM} WHERE ${where}`, params);
  const total = countRows[0]?.n || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const p2 = [...params, pageSize, (safePage - 1) * pageSize];
  const rows = await readQuery(
    `SELECT ${PRODUCT_SELECT} ${PRODUCT_FROM} WHERE ${where}
     ORDER BY ${order} LIMIT $${p2.length - 1} OFFSET $${p2.length}`,
    p2
  );
  return { items: rows.map(mapProduct), total, page: safePage, pageSize, totalPages };
}

/** Facets for the sidebar (scope = category / department / search only). */
export async function getFacets(scope = {}) {
  const params = [];
  const where = buildWhere({ ...scope, brands: undefined, minPrice: undefined, maxPrice: undefined, minRating: undefined, stock: undefined }, params);
  const [brands, range, stockCounts] = await Promise.all([
    readQuery(
      `SELECT p.brand AS name, COUNT(*)::int AS n ${PRODUCT_FROM}
       WHERE ${where} AND p.brand IS NOT NULL AND p.brand <> ''
       GROUP BY p.brand ORDER BY COUNT(*) DESC, p.brand ASC LIMIT 40`, params),
    readQuery(`SELECT MIN(p.price)::float AS min, MAX(p.price)::float AS max ${PRODUCT_FROM} WHERE ${where}`, params),
    readQuery(
      `SELECT COUNT(*) FILTER (WHERE p.stock > 0)::int AS in_stock,
              COUNT(*) FILTER (WHERE p.stock <= 0)::int AS out_stock ${PRODUCT_FROM} WHERE ${where}`, params),
  ]);
  return {
    brands: brands.filter((b) => b.name).map((b) => ({ name: b.name, count: b.n })),
    minPrice: range[0]?.min ?? 0,
    maxPrice: range[0]?.max ?? 0,
    inStock: stockCounts[0]?.in_stock ?? 0,
    outStock: stockCounts[0]?.out_stock ?? 0,
  };
}

export async function getProductByKey(key) {
  const k = String(key || '').trim();
  if (!k || k.length > 240) return null;
  const rows = await readQuery(
    `SELECT ${PRODUCT_SELECT} ${PRODUCT_FROM}
     WHERE (p.slug = $1 OR p.id::text = $1) AND COALESCE(p.is_archived, false) = false
     ORDER BY (p.slug = $1) DESC LIMIT 1`,
    [k]
  );
  return mapProduct(rows[0]);
}

/** For cart / wishlist / recently viewed. Includes archived rows (flagged) so the cart can explain. */
export async function getProductsByIds(ids) {
  const clean = [...new Set((ids || []).map((x) => parseInt(x, 10)).filter((n) => Number.isFinite(n) && n > 0))].slice(0, 60);
  if (!clean.length) return [];
  const rows = await readQuery(
    `SELECT ${PRODUCT_SELECT} ${PRODUCT_FROM} WHERE p.id = ANY($1::int[])`,
    [clean]
  );
  return rows.map(mapProduct);
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  const categoryId = (await readQuery(`SELECT category_id FROM products WHERE id = $1`, [parseInt(product.id, 10)]))[0]?.category_id;
  if (!categoryId) return [];
  const rows = await readQuery(
    `SELECT ${PRODUCT_SELECT} ${PRODUCT_FROM}
     WHERE p.category_id = $1 AND p.id <> $2 AND COALESCE(p.is_archived,false) = false
     ORDER BY p.is_featured DESC NULLS LAST, p.id DESC LIMIT $3`,
    [categoryId, parseInt(product.id, 10), limit]
  );
  return rows.map(mapProduct);
}

export async function getBrands() {
  try {
    const rows = await readQuery(`
      SELECT b.name, b.slug, b.logo_url, b.is_featured,
             (SELECT COUNT(*)::int FROM products p WHERE LOWER(p.brand) = LOWER(b.name) AND COALESCE(p.is_archived,false)=false) AS n
      FROM brands b WHERE COALESCE(b.is_active, true) = true
      ORDER BY b.sort_order ASC, b.name ASC`);
    return rows.map((r) => ({ name: r.name, slug: r.slug, logo: r.logo_url || null, featured: Boolean(r.is_featured), count: r.n || 0 }));
  } catch (err) {
    console.error('[catalog] brands failed:', err?.message);
    return [];
  }
}

export async function getHomeData() {
  const safe = async (fn, fallback) => { try { return await fn(); } catch (e) { console.error('[catalog] home part failed:', e?.message); return fallback; } };
  const [tree, featured, newNetworking, newConsumer, brands, totals] = await Promise.all([
    getCategoryTree(),
    safe(() => listProducts({ featured: true, pageSize: 8, sort: 'latest' }), { items: [] }),
    safe(() => listProducts({ department: 'networking', pageSize: 8, sort: 'latest' }), { items: [] }),
    safe(() => listProducts({ department: 'consumer', pageSize: 8, sort: 'latest' }), { items: [] }),
    getBrands(),
    safe(() => readQuery(`SELECT COUNT(*)::int AS products FROM products WHERE COALESCE(is_archived,false)=false`), [{ products: 0 }]),
  ]);
  let featuredItems = featured.items;
  if (!featuredItems.length) {
    featuredItems = (await safe(() => listProducts({ pageSize: 8, sort: 'latest' }), { items: [] })).items;
  }
  return {
    tree,
    featured: featuredItems,
    newNetworking: newNetworking.items,
    newConsumer: newConsumer.items,
    brands,
    productCount: totals[0]?.products || 0,
  };
}

/** Live search dropdown data. */
export async function searchSuggest(q, limit = 8) {
  const term = String(q || '').trim().slice(0, 80);
  if (term.length < 1) return { products: [], brands: [], categories: [] };
  const like = `%${esc(term)}%`;
  const [products, brands, categories] = await Promise.all([
    listProducts({ q: term, pageSize: limit, sort: 'featured' }),
    readQuery(
      `SELECT p.brand AS name, COUNT(*)::int AS n FROM products p
       WHERE COALESCE(p.is_archived,false)=false AND p.brand ILIKE $1
       GROUP BY p.brand ORDER BY COUNT(*) DESC LIMIT 4`, [like]),
    readQuery(
      `SELECT c.name, c.slug FROM categories c
       WHERE COALESCE(c.is_active,true)=true AND c.name ILIKE $1 ORDER BY c.name LIMIT 4`, [like]),
  ]);
  return {
    products: products.items,
    total: products.total,
    brands: brands.map((b) => ({ name: b.name, count: b.n })),
    categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
  };
}
