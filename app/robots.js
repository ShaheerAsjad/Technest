import { siteUrl } from '@/lib/site-url';

export default function robots() {
  const base = siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/checkout', '/cart', '/my-orders', '/sign-in', '/sign-up'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
