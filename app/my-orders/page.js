import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// Status badge color mapping
const STATUS_STYLES = {
  'Delivered':     { color: '#00D084', bg: 'rgba(0,208,132,0.1)', border: 'rgba(0,208,132,0.25)' },
  'Shipped':       { color: '#00D9FF', bg: 'rgba(0,217,255,0.1)', border: 'rgba(0,217,255,0.25)' },
  'Packed':        { color: '#FFB020', bg: 'rgba(255,176,32,0.1)', border: 'rgba(255,176,32,0.25)' },
  'Order Placed':  { color: '#A3A3A3', bg: 'rgba(163,163,163,0.1)', border: 'rgba(163,163,163,0.2)' },
};

export default async function MyOrdersPage() {
  // ── Clerk Auth — DO NOT MODIFY ─────────────────────────────────
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="checkout-auth-guard">
        <div className="checkout-auth-panel">
          <div className="checkout-auth-glow" aria-hidden="true" />
          <div className="checkout-auth-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <h1 className="checkout-auth-title">My Orders</h1>
          <p className="checkout-auth-text">
            Please sign in to view your purchase history and track your orders.
          </p>
          <Link href="/products" className="btn btn--primary" style={{ width: '100%', textAlign: 'center', padding: '14px', display: 'block' }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  // ── Neon DB fetch — DO NOT MODIFY ──────────────────────────────
  let orders = [];
  try {
    const ordersResult = await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`;
    orders = Array.isArray(ordersResult) ? ordersResult : (ordersResult.rows || []);
  } catch (error) {
    console.error("Fetch My Orders Error:", error);
  }
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="container py-8">
      <div className="orders-header">
        <h1 className="page-title">My Purchase History</h1>
        <p className="catalog-page__sub">
          {orders.length > 0 ? `${orders.length} order${orders.length > 1 ? 's' : ''} found` : 'No orders yet'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="catalog-empty mt-6">
          <div className="orders-empty-icon">📦</div>
          <p className="catalog-empty__text" style={{ marginBottom: '20px' }}>You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="btn btn--primary">
            Start Shopping →
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            let itemsList = [];
            try {
              itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch {
              itemsList = [];
            }

            const status = order.status || 'Order Placed';
            const statusStyle = STATUS_STYLES[status] || STATUS_STYLES['Order Placed'];

            return (
              <div key={order.id} className="order-card">
                {/* Header row */}
                <div className="order-card__header">
                  <div>
                    <span className="order-card__label">Order ID</span>
                    <h3 className="order-card__id">#{order.id}</h3>
                  </div>
                  <span
                    className="order-card__status"
                    style={{
                      color: statusStyle.color,
                      background: statusStyle.bg,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {status}
                  </span>
                </div>

                {/* Items summary */}
                <div className="order-card__items">
                  {itemsList.map((item, idx) => (
                    <div key={idx} className="order-card__item-row">
                      <span>{item.name || item.title || 'Product'} <span className="order-card__qty">× {item.quantity || 1}</span></span>
                      <span className="order-card__item-price">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer row */}
                <div className="order-card__footer">
                  <div>
                    <span className="order-card__label">Total Paid (COD)</span>
                    <span className="order-card__total">${Number(order.total_amount).toFixed(2)}</span>
                  </div>
                  <Link
                    href={`/order-tracking?orderId=${order.id}`}
                    className="btn btn--secondary order-card__track-btn"
                  >
                    Track Order →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
