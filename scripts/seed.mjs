// Seeds the Atlantic-style categories, brands and demo products (idempotent).
//   npm run db:seed              -> upsert (never touches stock of existing rows)
//   npm run db:seed -- --remove  -> delete ONLY rows created by this seed (source = 'atlantic-demo')
// Also runs once automatically from migrate.mjs.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { ROOT, loadEnv, c } from './_env.mjs';

const SEED_FILE = join(ROOT, 'data', 'seed', 'atlantic.json');
const SOURCE = 'atlantic-demo';

function slugify(input) {
  return String(input ?? '')
    .toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export async function runSeed(sql, { remove = false } = {}) {
  if (!existsSync(SEED_FILE)) {
    console.log(c.yellow('[seed] data/seed/atlantic.json not found - nothing to seed.'));
    return { ok: true, skipped: true };
  }
  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8'));

  if (remove) {
    const ids = (await sql`SELECT id FROM products WHERE source = ${SOURCE}`).map((r) => r.id);
    if (ids.length) {
      try { await sql`DELETE FROM reviews WHERE product_id = ANY(${ids})`; } catch { /* no reviews table */ }
      await sql`DELETE FROM products WHERE source = ${SOURCE}`;
    }
    console.log(c.green(`[seed] removed ${ids.length} demo products (categories/brands were kept).`));
    return { ok: true, removed: ids.length };
  }

  console.log(c.bold('[seed] seeding categories, brands, products...'));

  // keep serial sequences in sync (the original admin code needed this too)
  for (const t of ['categories', 'products']) {
    try {
      await sql.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`);
    } catch { /* ignore */ }
  }

  // ---- categories (parents first) -----------------------------------------
  const catId = {};   // seed slug -> db id
  const catSlug = {}; // seed slug -> real db slug
  const ordered = [...seed.categories].sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0));
  let catCount = 0;
  for (const cat of ordered) {
    let slug = cat.slug || slugify(cat.name);
    const parentId = cat.parent ? catId[cat.parent] ?? null : null;
    const dept = cat.department || 'networking';

    const existing = (await sql`SELECT id, department FROM categories WHERE slug = ${slug}`)[0];
    if (existing && existing.department !== dept) slug = `${slug}-${dept}`; // never hijack an old consumer category
    let name = cat.name;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const row = (await sql`
          INSERT INTO categories (name, slug, parent_id, department, sort_order, image, is_active)
          VALUES (${name}, ${slug}, ${parentId}, ${dept}, ${cat.sort ?? 0}, ${cat.image || null}, TRUE)
          ON CONFLICT (slug) DO UPDATE
            SET name = EXCLUDED.name, parent_id = EXCLUDED.parent_id, department = EXCLUDED.department,
                sort_order = EXCLUDED.sort_order, image = COALESCE(EXCLUDED.image, categories.image)
          RETURNING id, slug
        `)[0];
        catId[cat.slug || slugify(cat.name)] = row.id;
        catSlug[cat.slug || slugify(cat.name)] = row.slug;
        catCount++;
        break;
      } catch (err) {
        if (attempt === 0 && /duplicate|unique/i.test(String(err.message))) { name = `${cat.name} (IT)`; continue; }
        console.warn(c.yellow(`  ~ category "${cat.name}" skipped: ${String(err.message).slice(0, 100)}`));
      }
    }
  }

  // ---- brands -------------------------------------------------------------
  for (const [i, b] of (seed.brands || []).entries()) {
    try {
      await sql`
        INSERT INTO brands (name, slug, logo_url, sort_order, is_featured, is_active)
        VALUES (${b.name}, ${b.slug || slugify(b.name)}, ${b.logo || null}, ${b.sort ?? i}, ${Boolean(b.featured)}, TRUE)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = EXCLUDED.sort_order,
          is_featured = EXCLUDED.is_featured, logo_url = COALESCE(EXCLUDED.logo_url, brands.logo_url)
      `;
    } catch (err) {
      console.warn(c.yellow(`  ~ brand "${b.name}" skipped: ${String(err.message).slice(0, 100)}`));
    }
  }

  // ---- products -----------------------------------------------------------
  const takenSlugs = new Set((await sql`SELECT slug FROM products`).map((r) => r.slug));
  const skuToRow = new Map((await sql`SELECT sku, slug FROM products WHERE sku IS NOT NULL`).map((r) => [r.sku, r.slug]));
  let prodCount = 0;
  for (const p of seed.products) {
    const categoryId = catId[p.category] ?? null;
    let slug = skuToRow.get(p.sku);
    if (!slug) {
      const base = slugify(p.title) || 'product';
      slug = base; let n = 2;
      while (takenSlugs.has(slug)) slug = `${base}-${n++}`;
      takenSlugs.add(slug);
    }
    const img = p.image && existsSync(join(ROOT, 'public', p.image)) ? p.image : '/placeholder.svg';
    const images = JSON.stringify(img === '/placeholder.svg' ? [] : [img]);
    try {
      await sql`
        INSERT INTO products (title, description, price, original_price, stock, image, images, category_id,
                              brand, sku, slug, specs, is_featured, is_on_sale, is_archived, source, free_shipping)
        VALUES (${p.title}, ${p.description || ''}, ${p.price}, ${p.originalPrice || p.price}, ${p.stock ?? 25}, ${img},
                ${images}::jsonb, ${categoryId}, ${p.brand || null}, ${p.sku}, ${slug},
                ${JSON.stringify(p.specs || {})}::jsonb, ${Boolean(p.featured)},
                ${Boolean(p.originalPrice && p.originalPrice > p.price)}, FALSE, ${SOURCE}, ${Boolean(p.freeShipping)})
        ON CONFLICT (sku) WHERE sku IS NOT NULL DO UPDATE
          SET title = EXCLUDED.title, description = EXCLUDED.description, price = EXCLUDED.price,
              image = EXCLUDED.image, images = EXCLUDED.images, category_id = EXCLUDED.category_id,
              brand = EXCLUDED.brand, specs = EXCLUDED.specs, is_featured = EXCLUDED.is_featured
      `;
      prodCount++;
    } catch (err) {
      console.warn(c.yellow(`  ~ product "${p.title}" skipped: ${String(err.message).slice(0, 110)}`));
    }
  }
  // ---- default store settings (only when nothing has been saved yet) -------
  if (seed.settings) {
    try {
      const row = (await sql`SELECT data FROM store_settings WHERE id = 1`)[0];
      const empty = !row || !row.data || Object.keys(row.data).length === 0;
      if (empty) {
        await sql`
          INSERT INTO store_settings (id, data, updated_at) VALUES (1, ${JSON.stringify(seed.settings)}::jsonb, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`;
        console.log(c.green('[seed] default store settings saved (shipping zones, free shipping, COD...).'));
      }
    } catch (err) {
      console.warn(c.yellow(`  ~ store settings skipped: ${String(err.message).slice(0, 100)}`));
    }
  }

  // ---- coupons (never duplicates, never overwrites an existing code) --------
  for (const cp of seed.coupons || []) {
    try {
      await sql`
        INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, active)
        SELECT ${cp.code}, ${cp.type}, ${cp.value}, ${cp.minOrder || 0}, TRUE
        WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = ${String(cp.code).toUpperCase()})`;
    } catch (err) {
      console.warn(c.yellow(`  ~ coupon ${cp.code} skipped: ${String(err.message).slice(0, 100)}`));
    }
  }

  console.log(c.green(`[seed] done: ${catCount} categories, ${(seed.brands || []).length} brands, ${prodCount}/${seed.products.length} products.`));
  return { ok: true, catCount, prodCount };
}

// ---- CLI entry -------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error(c.red('[seed] DATABASE_URL missing (.env.local).'));
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);
  runSeed(sql, { remove: process.argv.includes('--remove') })
    .then(() => process.exit(0))
    .catch((e) => { console.error(c.red('[seed] ' + (e?.message || e))); process.exit(1); });
}
