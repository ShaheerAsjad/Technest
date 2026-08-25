'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Global keyboard shortcut: Cmd+K / Ctrl+K opens, Escape closes.
  useEffect(() => {
    function handleKeyDown(e) {
      const isK = e.key === 'k' || e.key === 'K';
      if ((e.metaKey || e.ctrlKey) && isK) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Also listen for a custom event so the Navbar search icon can open it.
  useEffect(() => {
    function openFromNavbar() {
      setOpen(true);
    }
    window.addEventListener('technest:open-search', openFromNavbar);
    return () => window.removeEventListener('technest:open-search', openFromNavbar);
  }, []);

  // Fetch products once, lazily, the first time the palette opens.
  useEffect(() => {
    if (!open || loaded) return;
    (async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('CommandPalette fetch error:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [open, loaded]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setActiveIndex(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const term = query.trim().toLowerCase();
  const results = !term
    ? products.slice(0, 6)
    : products
        .filter((p) => {
          const name = (p.title || p.name || '').toLowerCase();
          const category = (p.category || '').toLowerCase();
          return name.includes(term) || category.includes(term);
        })
        .slice(0, 8);

  function handleKeyNav(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && results[activeIndex]) {
      window.location.href = `/products/${results[activeIndex].id}`;
    }
  }

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="cmdk-input-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyNav}
            placeholder="Search products, categories…"
            className="cmdk-input"
          />
          <kbd className="cmdk-esc">ESC</kbd>
        </div>

        <div className="cmdk-results">
          {!loaded && <p className="cmdk-empty">Loading catalog…</p>}

          {loaded && results.length === 0 && (
            <p className="cmdk-empty">No matches for &ldquo;{query}&rdquo;.</p>
          )}

          {results.map((p, i) => {
            const name = p.title || p.name;
            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className={`cmdk-result${i === activeIndex ? ' cmdk-result--active' : ''}`}
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className="cmdk-result__img" />
                <div className="cmdk-result__info">
                  <span className="cmdk-result__name">{name}</span>
                  <span className="cmdk-result__meta">{p.category || 'Tech'} · ${Number(p.price).toFixed(2)}</span>
                </div>
                <span className="cmdk-result__arrow" aria-hidden="true">↵</span>
              </Link>
            );
          })}
        </div>

        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
