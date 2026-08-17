'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useUser, SignInButton } from '@clerk/nextjs';

export default function CheckoutPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { cart = [], clearCart } = useApp();

  const [showAlert, setShowAlert] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Checkout Products Fetch Error:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, []);

  // Map real cart items with product details
  const cartItems = cart
    .map((item) => {
      const targetId = String(item.id || item.productId);
      const prod = products.find((p) => String(p.id) === targetId);
      return prod ? { id: prod.id, name: prod.name || prod.title, price: prod.price, quantity: item.quantity || 1 } : null;
    })
    .filter(Boolean);

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Your cart is empty! Please add products to cart before checking out.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cartItems,
          totalAmount
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Order Successful! Your Order ID is: #${data.orderId}`);
        if (typeof clearCart === 'function') {
          clearCart();
        }
        router.push(`/order-success?orderId=${data.orderId}`);
      } else {
        alert('Error: ' + (data.error || 'Failed to place order'));
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#6b7280' }}>Loading Checkout...</div>;
  }

  // Agar user login nahi hai aur alert close nahi kiya, toh Access Denied alert card dikhayega
  if (!isSignedIn && showAlert) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        backgroundColor: '#f9f9f9',
        padding: '20px'
      }}>
        <div style={{
          position: 'relative',
          background: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '450px',
          width: '100%'
        }}>
          {/* Cross (X) Button */}
          <button 
            onClick={() => setShowAlert(false)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1
            }}
          >
            &times;
          </button>

          <h2 style={{ color: '#d9534f', marginBottom: '15px', fontSize: '1.5rem', fontWeight: 'bold' }}>Access Denied</h2>
          <p style={{ fontSize: '16px', color: '#333', marginBottom: '25px', lineHeight: '1.5' }}>
            Aapne order place karne ke liye login nahi kiya hai. Pehle <strong>Sign In</strong> karein taake aapka order secure ho sake.
          </p>

          <SignInButton mode="modal">
            <button style={{
              background: '#0070f3',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '6px',
              cursor: 'pointer',
              width: '100%'
            }}>
              Login Now
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>Checkout (Cash on Delivery)</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
          <input 
            type="text" required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Number</label>
          <input 
            type="text" required 
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Delivery Address</label>
          <textarea required 
            value={formData.address} 
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City</label>
          <input 
            type="text" required 
            value={formData.city} 
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
          />
        </div>

        <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px', marginTop: '10px' }}>
          <strong>Payment Method:</strong> Cash on Delivery (COD)
          <div style={{ marginTop: '5px', fontSize: '1.1rem', color: '#0070f3' }}>
            Total Amount: ${totalAmount.toFixed(2)}
          </div>
        </div>

        <button 
          type="submit" disabled={loading || loadingProducts}
          style={{
            backgroundColor: '#0070f3', color: '#fff', padding: '12px', border: 'none', 
            borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing Order...' : 'Confirm & Place Order'}
        </button>
      </form>
    </div>
  );
}
