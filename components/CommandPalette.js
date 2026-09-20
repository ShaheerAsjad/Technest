'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { formatPrice } from '@/lib/format';
import { fetchJson } from '@/lib/client';
import SafeImage from './SafeImage';

/**
 * Live search (Ctrl/Cmd+K or the navbar search box): products by name, brand or SKU,
 * plus matching brands and categories. Debounced, cancels stale requests.
 */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ products: [], brands: [], categories: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [navigated, setNavigated] = useState(false);
  const inputRef = useRef(null);

  // Ctrl/Cmd+K toggles, Escape closes
  useEffect(() => {
    function handleKeyDown(e) {
      const isK = e.key === 'k' || e.key === 'K';
      if ((e.metaKey || e.ctrlKey) && isK) { e.preventDefault(); setOpen((v) => !v); }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The navbar search box opens it with a custom event
  useEffect(() => {
    const openFromNavbar = () => setOpen(true);
    window.addEventListener('technest:open-search', openFromNavbar);
    return () => window.removeEventListener('technest:open-search', openFromNavbar);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setActiveIndex(0);
      setNavigated(false);
      setFailed(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Debounced fetch
  useEffect(() => {
    if (!open) return undefined;
    const term = query.trim();
    if (term.length < 2) {
      setData({ products: [], brands: [], categories: [], total: 0 });
      setLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await fetchJson(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal }, { timeout: 8000, retries: 0 });
      if (controller.signal.aborted) return;
      setLoading(false);
      if (res.ok && res.data) { setData(res.data); setFailed(false); }
      else setFailed(true);
    }, 220);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open]);

  const results = data.products || [];

  function goAll() {
    const term = query.trim();
    setOpen(false);
    if (term) router.push(`/products?q=${encodeURIComponent(term)}`);
  }

  function handleKeyNav(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setNavigated(true); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setNavigated(true); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const p = results[activeIndex];
      if (navigated && p) {
        setOpen(false);
        router.push(`/products/${p.slug || p.id}`);
      } else goAll();
    }
  }

  if (!open) return null;
  const term = query.trim();

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search">
        <div className="cmdk-input-row">
          <span className="cmdk-input-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); setNavigated(false); }}
            onKeyDown={handleKeyNav}
            placeholder="Search products, brands, SKUs…"
            className="cmdk-input"
            aria-label="Search products"
            autoComplete="off"
          />
          <kbd className="cmdk-esc">ESC</kbd>
        </div>

        {(data.brands?.length > 0 || data.categories?.length > 0) && (
          <div className="cmdk-chips">
            {data.brands.map((b) => (
              <Link key={`b-${b.name}`} href={`/products?brand=${encodeURIComponent(b.name)}`} className="cmdk-chip" onClick={() => setOpen(false)}>{b.name}</Link>
            ))}
            {data.categories.map((c) => (
              <Link key={`c-${c.slug}`} href={`/category/${c.slug}`} className="cmdk-chip cmdk-chip--cat" onClick={() => setOpen(false)}>{c.name}</Link>
            ))}
          </div>
        )}

        <div className="cmdk-results">
          {term.length < 2 && <p className="cmdk-empty">Type at least 2 letters — try a model, brand or SKU.</p>}
          {term.length >= 2 && loading && results.length === 0 && <p className="cmdk-empty">Searching…</p>}
          {term.length >= 2 && failed && <p className="cmdk-empty">Search is temporarily unavailable. Press Enter to open the catalogue instead.</p>}
          {term.length >= 2 && !loading && !failed && results.length === 0 && (
            <p className="cmdk-empty">No matches for &ldquo;{term}&rdquo;.</p>
          )}

          {results.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.slug || p.id}`}
              className={`cmdk-result${i === activeIndex ? ' cmdk-result--active' : ''}`}
              onClick={() => setOpen(false)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <SafeImage src={p.image} alt="" className="cmdk-result__img" />
              <div className="cmdk-result__info">
                <span className="cmdk-result__name">{p.title || p.name}</span>
                <span className="cmdk-result__meta">
                  {[p.brand || p.category, p.sku].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span className="cmdk-result__price">{formatPrice(p.price)}</span>
            </Link>
          ))}

          {term.length >= 2 && data.total > results.length && (
            <button type="button" className="cmdk-all" onClick={goAll}>See all {data.total} results →</button>
          )}
        </div>

        <div className="cmdk-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open all results</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
