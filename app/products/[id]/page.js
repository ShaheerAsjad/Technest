import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';
import { getProductByKey, getRelatedProducts, getCategoryTree, breadcrumbFor } from '@/lib/catalog';
import { getStoreSettings, publicSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const p = await getProductByKey(id);
    if (!p) return { title: 'Product not found — TechNest' };
    return {
      title: `${p.name} — TechNest`,
      description: (p.description || `${p.name}${p.brand ? ` by ${p.brand}` : ''} — buy online at TechNest.`).slice(0, 160),
      openGraph: { title: p.name, images: p.image && p.image.startsWith('http') ? [p.image] : undefined },
    };
  } catch {
    return { title: 'Product — TechNest' };
  }
}

export default async function ProductPage({ params }) {
  const { id } = await params;

  let product = null;
  let failed = false;
  try {
    product = await getProductByKey(id);
  } catch (err) {
    console.error('[product page]', err?.message);
    failed = true;
  }

  if (failed) {
    return (
      <div className="container py-8 text-center" style={{ minHeight: '50vh' }}>
        <h1 className="page-title mb-4">We could not load this product</h1>
        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Please refresh the page in a moment.</p>
        <Link href="/products" className="btn btn--primary">Back to Products</Link>
      </div>
    );
  }
  if (!product) notFound();

  // Old numeric links (/products/12) -> canonical slug URL
  if (/^\d+$/.test(String(id)) && product.slug && product.slug !== String(id)) {
    redirect(`/products/${product.slug}`);
  }

  const [related, tree, settings] = await Promise.all([
    getRelatedProducts(product, 4).catch(() => []),
    getCategoryTree(),
    getStoreSettings(),
  ]);
  const catId = tree.flat.find((c) => c.slug === product.categorySlug)?.id;
  const trail = catId ? breadcrumbFor(tree, catId).map((c) => ({ name: c.name, slug: c.slug })) : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    description: product.description || undefined,
    image: product.images,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ProductDetail product={product} related={related} settings={publicSettings(settings)} trail={trail} />
    </>
  );
}
