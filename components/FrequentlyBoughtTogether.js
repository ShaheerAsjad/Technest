'use client';

import { useApp } from '@/context/AppContext';

export default function FrequentlyBoughtTogether({ product, allProducts }) {
  const { addToCart } = useApp();

  const partners = allProducts
    .filter((p) => p.category === product.category && String(p.id) !== String(product.id) && p.stock > 0)
    .slice(0, 2);

  if (partners.length === 0) return null;

  const bundle = [product, ...partners];
  const total = bundle.reduce((sum, p) => sum + Number(p.price), 0);

  function addBundleToCart() {
    bundle.forEach((p) => addToCart(p.id, 1));
  }

  return (
    <div className="fbt">
      <div className="section-title-wrap">
        <h2 className="section-title">Frequently Bought Together</h2>
      </div>

      <div className="fbt__row">
        {bundle.map((p, i) => (
          <div key={p.id} className="fbt__item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.title || p.name} className="fbt__img" />
            <span className="fbt__name">{p.title || p.name}</span>
            <span className="fbt__price">${Number(p.price).toFixed(2)}</span>
            {i < bundle.length - 1 && <span className="fbt__plus" aria-hidden="true">+</span>}
          </div>
        ))}
      </div>

      <div className="fbt__footer">
        <span className="fbt__total">Total: <strong>${total.toFixed(2)}</strong></span>
        <button className="btn btn--primary" onClick={addBundleToCart}>
          Add All {bundle.length} to Cart
        </button>
      </div>
    </div>
  );
}
