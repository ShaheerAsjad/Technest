import { formatPrice } from '@/lib/format';

/** Shared price breakdown rows (cart + checkout) rendered from the server's pricing object. */
export default function OrderSummaryRows({ pricing, estimateShipping = false }) {
  if (!pricing) return null;
  const p = pricing;
  return (
    <>
      <div className="cart-summary__rows">
        <div className="cart-summary__row"><span>Subtotal</span><span>{formatPrice(p.subtotal)}</span></div>
        {p.discount > 0 && (
          <div className="cart-summary__row cart-summary__row--discount"><span>Discount ({p.couponCode})</span><span>− {formatPrice(p.discount)}</span></div>
        )}
        <div className="cart-summary__row">
          <span>Shipping{p.zoneName ? ` (${p.zoneName})` : ''}</span>
          {p.shippingFree
            ? <span className="cart-summary__free">Free</span>
            : <span>{formatPrice(p.shipping)}{estimateShipping ? ' *' : ''}</span>}
        </div>
        {p.taxEnabled && p.tax > 0 && (
          <div className="cart-summary__row">
            <span>{p.taxLabel}{p.taxInclusive ? ' (included)' : ''}</span>
            <span>{formatPrice(p.tax)}</span>
          </div>
        )}
        {p.codFee > 0 && <div className="cart-summary__row"><span>COD fee</span><span>{formatPrice(p.codFee)}</span></div>}
      </div>
      <div className="cart-summary__total-row">
        <span>Total</span>
        <span className="checkout-total-val">{formatPrice(p.total)}</span>
      </div>
      {estimateShipping && !p.shippingFree && <p className="cart-summary__note">* Final delivery charge is confirmed at checkout, based on your city.</p>}
      {p.freeShippingRemaining > 0 && !p.shippingFree && (
        <p className="cart-summary__note cart-summary__note--promo">Add {formatPrice(p.freeShippingRemaining)} more to get free shipping.</p>
      )}
      {p.eta && <p className="cart-summary__note">Estimated delivery: {p.eta}</p>}
    </>
  );
}
