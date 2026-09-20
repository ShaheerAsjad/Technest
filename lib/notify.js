import sql from './db';
import { sendBackInStockEmail } from './email';
import { siteUrl } from './site-url';

/**
 * Sends the "back in stock" e-mail to everyone who asked to be notified about a product
 * (each person is e-mailed only once). Returns { sent, skipped }.
 * Never throws - a mail problem must never block the admin's stock update.
 */
export async function notifyBackInStock(productId) {
  try {
    const id = parseInt(productId, 10);
    if (!Number.isFinite(id)) return { sent: 0, skipped: 0 };
    const [product] = await sql`SELECT id, title, slug, stock FROM products WHERE id = ${id}`;
    if (!product || Number(product.stock) <= 0) return { sent: 0, skipped: 0 };

    const subs = await sql`
      SELECT email FROM notify_subscribers WHERE product_id = ${id} AND notified_at IS NULL LIMIT 300`;
    if (!subs.length) return { sent: 0, skipped: 0 };

    const url = `${siteUrl()}/products/${product.slug || product.id}`;
    let sent = 0;
    let skipped = 0;
    for (const s of subs) {
      const res = await sendBackInStockEmail({ to: s.email, productName: product.title, productUrl: url });
      if (res && res.skipped) { skipped++; continue; }   // no e-mail service configured / failed: keep them for later
      sent++;
      await sql`UPDATE notify_subscribers SET notified_at = NOW() WHERE product_id = ${id} AND email = ${s.email}`;
    }
    return { sent, skipped };
  } catch (err) {
    console.error('[notify] back-in-stock failed:', err?.message);
    return { sent: 0, skipped: 0, error: true };
  }
}
