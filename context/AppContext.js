'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const AppContext = createContext(null);

function loadJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota exceeded - the app keeps working in memory */
  }
}

/** Corrupt or old cart data can never crash the app. */
function cleanCart(raw) {
  if (!Array.isArray(raw)) return [];
  const map = new Map();
  for (const it of raw) {
    const id = String(it?.productId ?? it?.id ?? '').trim();
    const qty = Math.floor(Number(it?.quantity ?? 1));
    if (!id || !Number.isFinite(qty) || qty < 1) continue;
    map.set(id, Math.min(99, (map.get(id) || 0) + qty));
  }
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const wishlistRef = useRef([]);

  // Load persisted state once, on first mount (client only).
  useEffect(() => {
    setCart(cleanCart(loadJSON('technest_cart', [])));
    const wl = loadJSON('technest_wishlist', []);
    setWishlist(Array.isArray(wl) ? wl.map(String) : []);
    const th = loadJSON('technest_theme', 'dark');
    setTheme(th === 'light' ? 'light' : 'dark');
    setMounted(true);
  }, []);

  useEffect(() => { if (mounted) saveJSON('technest_cart', cart); }, [cart, mounted]);
  useEffect(() => { wishlistRef.current = wishlist; if (mounted) saveJSON('technest_wishlist', wishlist); }, [wishlist, mounted]);
  useEffect(() => {
    if (!mounted) return;
    saveJSON('technest_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, mounted]);

  // Keep several open tabs in sync.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'technest_cart') setCart(cleanCart(loadJSON('technest_cart', [])));
      if (e.key === 'technest_wishlist') {
        const wl = loadJSON('technest_wishlist', []);
        setWishlist(Array.isArray(wl) ? wl.map(String) : []);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 3000);
  }, []);

  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const id = String(productId);
      const qty = Math.max(1, Math.floor(Number(quantity) || 1));
      setCart((prev) => {
        const existing = prev.find((i) => String(i.productId) === id);
        if (existing) {
          return prev.map((i) =>
            String(i.productId) === id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i
          );
        }
        return [...prev, { productId: id, quantity: Math.min(99, qty) }];
      });
      showToast('Added to cart');
    },
    [showToast]
  );

  const updateQuantity = useCallback((productId, quantity) => {
    const id = String(productId);
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((i) => String(i.productId) !== id);
      return prev.map((i) => (String(i.productId) === id ? { ...i, quantity: Math.min(99, Math.floor(quantity)) } : i));
    });
  }, []);

  const removeFromCart = useCallback(
    (productId) => {
      const id = String(productId);
      setCart((prev) => prev.filter((i) => String(i.productId) !== id));
      showToast('Item removed', 'danger');
    },
    [showToast]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback(
    (productId) => {
      const id = String(productId);
      const isIn = wishlistRef.current.map(String).includes(id);
      setWishlist((prev) => (prev.map(String).includes(id) ? prev.filter((x) => String(x) !== id) : [...prev, id]));
      showToast(isIn ? 'Removed from wishlist' : 'Added to wishlist');
    },
    [showToast]
  );

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const value = {
    mounted,
    cart,
    wishlist,
    theme,
    toasts,
    cartOpen,
    openCart,
    closeCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    toggleTheme,
    showToast,
    isInWishlist: (id) => wishlist.map(String).includes(String(id)),
    cartCount: cart.reduce((s, i) => s + i.quantity, 0),
    wishlistCount: wishlist.length,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
