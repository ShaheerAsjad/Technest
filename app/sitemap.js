import { readQuery } from '@/lib/db';
import { siteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

// /sitemap.xml - home, static pages, every category and every live product.
export default async function sitemap() {
  const base = siteUrl();
  const now = new Date();
  const pages = ['', '/products', '/about', '/contact', '/b2b', '/order-tracking', '/privacy-policy', '/terms', '/return-policy', '/shipping-policy']
    .map((p) => ({ url: `${base}${p}`, lastModified: now }));

  let categories = [];
  let products = [];
  try {
    const [c, p] = await Promise.all([
      readQuery(`SELECT slug FROM categories WHERE COALESCE(is_active, true) = true AND slug IS NOT NULL`),
      readQuery(`SELECT slug FROM products WHERE COALESCE(is_archived, false) = false AND slug IS NOT NULL ORDER BY id DESC LIMIT 5000`),
    ]);
    categories = c.map((r) => ({ url: `${base}/category/${r.slug}`, lastModified: now }));
    products = p.map((r) => ({ url: `${base}/products/${r.slug}`, lastModified: now }));
  } catch (err) {
    console.error('[sitemap]', err?.message); // still return the static pages
  }
  return [...pages, ...categories, ...products];
}
