import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '15px', color: '#111827' }}>My Orders</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Please log in to view your purchase history and track your orders.</p>
        <Link href="/products" style={{ display: 'inline-block', padding: '10px 20px', background: '#0070f3', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Browse Products
        </Link>
      </div>
    );
  }

  let orders = [];
  try {
    const ordersResult = await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC`;
    orders = Array.isArray(ordersResult) ? ordersResult : (ordersResult.rows || []);
  } catch (error) {
    console.error("Fetch My Orders Error:", error);
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>
        My Purchase History
      </h1>

      {orders.length === 0 ? (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', textAlign: 'center', color: '#6b7280', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '15px' }}>You haven't placed any orders yet.</p>
          <Link href="/products" style={{ display: 'inline-block', padding: '10px 20px', background: '#0070f3', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            let itemsList = [];
            try {
              itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch (e) {
              itemsList = [];
            }

            return (
              <div 
                key={order.id} 
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Order ID</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '2px 0 0 0', color: '#111827' }}>#{order.id}</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span 
                      style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        fontWeight: '600', 
                        background: '#e0e7ff', 
                        color: '#3730a3' 
                      }}
                    >
                      {order.status || 'Order Placed'}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div style={{ marginBottom: '15px' }}>
                  {itemsList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: '#4b5563', marginBottom: '6px' }}>
                      <span>{item.name || item.title || 'Product'} × {item.quantity || 1}</span>
                      <span style={{ fontWeight: '500' }}>${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: '#6b7280', display: 'block' }}>Total Paid (COD)</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#0070f3' }}>${Number(order.total_amount).toFixed(2)}</span>
                  </div>
                  <Link 
                    href={`/order-tracking?orderId=${order.id}`}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}
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
