'use client';

import Link from 'next/link';
import { useApp, TAX_RATE, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_COST } from '@/context/AppContext';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { cartDetailed, updateQuantity, removeFromCart, subtotal } = useApp();

  const tax = subtotal * TAX_RATE;
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
  const total = subtotal + tax + shipping;

  return (
    <>
      <h1 className="page-title">Your Cart</h1>

      {cartDetailed.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link href="/products" className="btn btn--primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cartDetailed.map((item) => (
              <div key={item.id} className="cart-row reveal reveal--visible">
                <div className="cart-row__image-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="cart-row__image" src={item.image} alt={item.name} />
                </div>
                <div className="cart-row__info">
                  <p className="cart-row__name">{item.name}</p>
                  <p className="cart-row__price">{formatPrice(item.price)}</p>
                </div>
                <div className="cart-row__qty">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                </div>
                <p className="cart-row__line-total">{formatPrice(item.price * item.quantity)}</p>
                <button className="cart-row__remove" onClick={() => removeFromCart(item.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <aside className="order-summary">
            <h2 className="section-title">Order Summary</h2>
            <div className="summary__row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary__row">
              <span>Tax</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="summary__row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="summary__row summary__row--total">
              <span>Total</span>
              <span className="summary__total-value">{formatPrice(total)}</span>
            </div>
            <Link href="/checkout" className="btn btn--primary summary__checkout-btn">
              Proceed to Checkout
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
