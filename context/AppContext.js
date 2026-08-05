'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PRODUCTS } from '@/data/products';

const AppContext = createContext(null);

export const TAX_RATE = 0.05;
export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_COST = 9.99;
export const EXPRESS_SHIPPING_COST = 19.99;

function loadJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('light');
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Load persisted state once, on first mount (client only).
  useEffect(() => {
    setCart(loadJSON('technest_cart', []));
    setWishlist(loadJSON('technest_wishlist', []));
    setTheme(loadJSON('technest_theme', 'light'));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('technest_cart', JSON.stringify(cart));
  }, [cart, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('technest_wishlist', JSON.stringify(wishlist));
  }, [wishlist, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('technest_theme', JSON.stringify(theme));
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 3000);
  }, []);

  const addToCart = useCallback(
    (productId, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { productId, quantity }];
      });
      showToast('Added to cart');
    },
    [showToast]
  );

  const updateQuantity = useCallback((productId, quantity) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const removeFromCart = useCallback(
    (productId) => {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      showToast('Item removed', 'danger');
    },
    [showToast]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    (productId) => {
      setWishlist((prev) => {
        const isIn = prev.includes(productId);
        showToast(isIn ? 'Removed from wishlist' : 'Added to wishlist');
        return isIn ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [showToast]
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const cartDetailed = cart
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  const subtotal = cartDetailed.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = {
    mounted,
    cart,
    cartDetailed,
    wishlist,
    theme,
    toasts,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    toggleTheme,
    showToast,
    isInWishlist: (id) => wishlist.includes(id),
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    wishlistCount: wishlist.length,
    subtotal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
