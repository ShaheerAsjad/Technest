import { json } from '@/lib/api';
import sql from '@/lib/db';
import { envStatus } from '@/lib/env';

export const dynamic = 'force-dynamic';

// GET /api/health  -> quick self-check (no secrets are ever returned)
export async function GET() {
  const env = envStatus();
  const out = { ok: true, env: { ok: env.ok, missing: env.missing, optionalMissing: env.optionalMissing }, db: { ok: false } };
  try {
    await sql`SELECT 1`;
    out.db.ok = true;
    const need = {
      products: ['slug', 'sku', 'brand', 'images', 'specs', 'free_shipping', 'tax_rate'],
      categories: ['slug', 'parent_id', 'department', 'sort_order', 'is_active'],
      orders: ['subtotal', 'shipping_fee', 'tax_amount', 'pricing_snapshot', 'idempotency_key', 'payment_status'],
      coupons: ['min_order_amount', 'max_uses', 'used_count', 'active'],
    };
    const cols = await sql`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('products','categories','orders','coupons')`;
    const have = new Set(cols.map((c) => `${c.table_name}.${c.column_name}`));
    const missing = [];
    for (const [t, list] of Object.entries(need)) for (const c of list) if (!have.has(`${t}.${c}`)) missing.push(`${t}.${c}`);
    const tables = await sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema='public'
      AND table_name IN ('store_settings','rate_limits','media','brands')`;
    const haveT = new Set(tables.map((t) => t.table_name));
    for (const t of ['store_settings', 'rate_limits', 'media', 'brands']) if (!haveT.has(t)) missing.push(`table:${t}`);
    out.db.migrated = missing.length === 0;
    out.db.missing = missing;
    if (missing.length) out.hint = 'Run: npm run db:migrate';
  } catch (err) {
    out.db = { ok: false, error: String(err?.message || err).slice(0, 160) };
  }
  out.ok = env.ok && out.db.ok && out.db.migrated !== false;
  return json(out, out.ok ? 200 : 503, { 'Cache-Control': 'no-store' });
}
