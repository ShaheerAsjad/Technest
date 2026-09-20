// Bulk product import (CSV or JSON).
//   npm run import:products -- import/my-products.csv --dry-run     (report only, changes NOTHING)
//   npm run import:products -- import/my-products.csv               (really import)
// Options: --department=networking|consumer (default networking)   --source=name (default "import")
//
// CSV columns (header names are case-insensitive; only sku/title/price are required):
//   sku, title (or name), price, original_price, stock, brand, category, description,
//   image, images (separated by |), specs (Key:Value|Key:Value), featured, free_shipping, slug
//   category may be a path:  "SFP / QSFP > SFP 10G"  (separator is ">")  - missing categories are created.
//   image may be a full https:// URL, or a file name that exists in public/products/ (recommended).
// Re-running the import updates products by SKU (stock is NOT overwritten unless you pass --update-stock).
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { ROOT, loadEnv, c } from './_env.mjs';

loadEnv();
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || d;
if (!file) { console.error('Usage: npm run import:products -- <file.csv|file.json> [--dry-run] [--department=networking] [--update-stock]'); process.exit(1); }
if (!existsSync(file)) { console.error(c.red(`File not found: ${file}`)); process.exit(1); }

const DRY = flag('dry-run');
const DEPT = ['networking', 'consumer'].includes(opt('department', 'networking')) ? opt('department', 'networking') : 'networking';
const SOURCE = opt('source', 'import');

const slugify = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

function parseCsv(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cur += ch;
  }
  row.push(cur);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

function load() {
  const raw = readFileSync(file, 'utf8');
  if (extname(file).toLowerCase() === '.json') {
    const j = JSON.parse(raw);
    return (Array.isArray(j) ? j : j.products || []).map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toLowerCase().trim(), v])));
  }
  const [head, ...body] = parseCsv(raw);
  const keys = head.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

const num = (v) => { const n = Number(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) && String(v ?? '').trim() !== '' ? n : null; };
const yes = (v) => ['1', 'yes', 'true', 'y'].includes(String(v ?? '').trim().toLowerCase());

const rows = load();
if (!rows.length) { console.error(c.red('No rows found in the file.')); process.exit(1); }

const problems = []; const clean = []; const seenSku = new Set();
rows.forEach((r, i) => {
  const line = i + 2;
  const title = String(r.title || r.name || '').trim();
  const sku = String(r.sku || '').trim();
  const price = num(r.price);
  if (!title) return problems.push(`line ${line}: missing title - skipped`);
  if (price === null || price <= 0) return problems.push(`line ${line} (${title}): invalid price "${r.price}" - skipped`);
  if (!sku) problems.push(`line ${line} (${title}): no SKU - a new product is created every run (add a SKU to allow updates)`);
  if (sku && seenSku.has(sku.toLowerCase())) return problems.push(`line ${line} (${title}): duplicate SKU ${sku} in file - skipped`);
  if (sku) seenSku.add(sku.toLowerCase());
  const orig = num(r.original_price ?? r.compare_price);
  const stock = num(r.stock ?? r.qty ?? r.quantity);
  const specs = {};
  if (r.specs && typeof r.specs === 'object') Object.assign(specs, r.specs);
  else String(r.specs || '').split('|').forEach((kv) => { const [k, ...v] = kv.split(':'); if (k && v.length) specs[k.trim()] = v.join(':').trim(); });
  const resolveImg = (s) => {
    s = String(s || '').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
    if (existsSync(join(ROOT, 'public', 'products', s))) return `/products/${s}`;
    problems.push(`line ${line} (${title}): image "${s}" not found in public/products - placeholder used`);
    return null;
  };
  const imgs = [resolveImg(r.image), ...String(r.images || '').split('|').map(resolveImg)].filter(Boolean);
  clean.push({
    sku: sku || null, title, slug: slugify(r.slug || title), brand: String(r.brand || '').trim() || null,
    category: String(r.category || '').trim(), price, original: orig && orig > price ? orig : null,
    stock: stock === null ? 10 : Math.max(0, Math.trunc(stock)), description: String(r.description || '').trim().slice(0, 5000),
    images: [...new Set(imgs)], specs, featured: yes(r.featured), freeShipping: yes(r.free_shipping),
  });
});

console.log(c.bold(`\n${DRY ? 'DRY RUN - nothing will be changed. ' : ''}${clean.length} valid product(s) of ${rows.length} row(s).`));
problems.forEach((p) => console.log(c.yellow('  ! ' + p)));
if (DRY && !process.env.DATABASE_URL) { console.log(c.dim('\n(no database check in dry-run without DATABASE_URL)')); process.exit(0); }
if (!process.env.DATABASE_URL) { console.error(c.red('DATABASE_URL missing (.env.local)')); process.exit(1); }

const sql = neon(process.env.DATABASE_URL);
const catCache = new Map(); // "parentId|slug" -> id
const newCats = [];

async function ensureCategory(pathStr) {
  const parts = String(pathStr || '').split('>').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  let parentId = null;
  for (const name of parts) {
    const slug = slugify(name);
    const key = `${parentId}|${slug}`;
    if (catCache.has(key)) { parentId = catCache.get(key); continue; }
    const found = (await sql`SELECT id, parent_id, department FROM categories WHERE slug = ${slug} LIMIT 1`)[0];
    if (found) { catCache.set(key, found.id); parentId = found.id; continue; }
    newCats.push(name);
    if (DRY) { catCache.set(key, -1); parentId = -1; continue; }
    const row = (await sql`
      INSERT INTO categories (name, slug, parent_id, department, sort_order, is_active)
      VALUES (${name}, ${slug}, ${parentId === -1 ? null : parentId}, ${DEPT}, 50, TRUE)
      ON CONFLICT (slug) DO UPDATE SET name = categories.name RETURNING id`)[0];
    catCache.set(key, row.id); parentId = row.id;
  }
  return parentId;
}

try { if (!DRY) await sql.query(`SELECT setval(pg_get_serial_sequence('products','id'), COALESCE((SELECT MAX(id) FROM products), 0) + 1, false)`); } catch { /* ignore */ }

const takenSlugs = new Set((await sql`SELECT slug FROM products`).map((r) => r.slug));
const existingBySku = new Map((await sql`SELECT sku, id, slug FROM products WHERE sku IS NOT NULL`).map((r) => [String(r.sku).toLowerCase(), r]));
let created = 0, updated = 0, failed = 0;

for (const p of clean) {
  try {
    const categoryId = await ensureCategory(p.category);
    const existing = p.sku ? existingBySku.get(p.sku.toLowerCase()) : null;
    const image = p.images[0] || '/placeholder.svg';
    const images = JSON.stringify(p.images);
    if (existing) {
      updated++;
      if (DRY) continue;
      await sql`
        UPDATE products SET title = ${p.title}, description = ${p.description}, price = ${p.price}, original_price = ${p.original || p.price},
          image = ${image}, images = ${images}::jsonb, category_id = ${categoryId === -1 ? null : categoryId}, brand = ${p.brand},
          specs = ${JSON.stringify(p.specs)}::jsonb, is_featured = ${p.featured}, free_shipping = ${p.freeShipping},
          is_on_sale = ${Boolean(p.original)}, is_archived = FALSE
        WHERE id = ${existing.id}`;
      if (flag('update-stock')) await sql`UPDATE products SET stock = ${p.stock} WHERE id = ${existing.id}`;
    } else {
      let slug = p.slug || 'product'; const base = slug; let n = 2;
      while (takenSlugs.has(slug)) slug = `${base}-${n++}`;
      takenSlugs.add(slug);
      created++;
      if (DRY) continue;
      await sql`
        INSERT INTO products (title, description, price, original_price, stock, image, images, category_id, brand, sku, slug, specs,
                              is_featured, is_on_sale, is_archived, free_shipping, source)
        VALUES (${p.title}, ${p.description}, ${p.price}, ${p.original || p.price}, ${p.stock}, ${image}, ${images}::jsonb,
                ${categoryId === -1 ? null : categoryId}, ${p.brand}, ${p.sku}, ${slug}, ${JSON.stringify(p.specs)}::jsonb,
                ${p.featured}, ${Boolean(p.original)}, FALSE, ${p.freeShipping}, ${SOURCE})`;
    }
  } catch (err) {
    failed++;
    console.log(c.red(`  x ${p.title}: ${String(err.message).slice(0, 120)}`));
  }
}
console.log(`\n  ${c.green(created + ' to create/created')}, ${c.green(updated + ' to update/updated')}, ${failed ? c.red(failed + ' failed') : '0 failed'}${newCats.length ? `, new categories: ${[...new Set(newCats)].join(', ')}` : ''}`);
console.log(DRY ? c.dim('  Dry run finished. Re-run without --dry-run to apply.\n') : c.green('  Import finished. Products are live on the store.\n'));
