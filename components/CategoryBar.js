'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Desktop category strip under the main navbar (Atlantic-style mega menu):
 * horizontally scrollable, dropdowns for sub-categories, active item underlined.
 * Dropdowns use position:fixed so the scroll container never clips them.
 */
export default function CategoryBar({ tree }) {
  const pathname = usePathname();
  const scrollRef = useRef(null);
  const closeTimer = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [menu, setMenu] = useState(null); // { key, left, top }

  const networking = tree?.departments?.networking || [];
  const consumer = tree?.departments?.consumer || [];

  const items = [
    ...networking.map((c) => ({ key: `c-${c.id}`, label: c.name, href: `/category/${c.slug}`, node: c, children: c.children })),
    ...(consumer.length
      ? [{ key: 'consumer', label: 'Consumer Tech', href: '/products?dept=consumer', node: null, children: consumer }]
      : []),
  ];

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => { el.removeEventListener('scroll', updateArrows); window.removeEventListener('resize', updateArrows); };
  }, [updateArrows, items.length]);

  useEffect(() => { setMenu(null); }, [pathname]);

  const openMenu = (key, el) => {
    clearTimeout(closeTimer.current);
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 300));
    setMenu({ key, left, top: r.bottom });
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 160);
  };
  const scrollBy = (dx) => scrollRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  const isActive = (item) => {
    const slugs = [];
    const walk = (n) => { slugs.push(n.slug); (n.children || []).forEach(walk); };
    if (item.node) walk(item.node);
    else (item.children || []).forEach(walk);
    return slugs.some((s) => pathname === `/category/${s}`);
  };

  if (!items.length) return null;
  const openItem = items.find((i) => i.key === menu?.key);

  return (
    <div className="catbar" onMouseLeave={scheduleClose}>
      <div className="catbar__inner">
        <button type="button" className={`catbar__arrow catbar__arrow--left${canLeft ? ' is-on' : ''}`} onClick={() => scrollBy(-260)} aria-label="Scroll categories left" tabIndex={canLeft ? 0 : -1}>‹</button>

        <div className="catbar__scroll" ref={scrollRef}>
          <Link href="/" className={`catbar__item${pathname === '/' ? ' catbar__item--active' : ''}`}>Home</Link>
          <Link href="/products" className={`catbar__item${pathname === '/products' ? ' catbar__item--active' : ''}`}>All Products</Link>
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`catbar__item${isActive(item) ? ' catbar__item--active' : ''}${menu?.key === item.key ? ' is-open' : ''}`}
              onMouseEnter={(e) => (item.children?.length ? openMenu(item.key, e.currentTarget) : setMenu(null))}
              onFocus={(e) => (item.children?.length ? openMenu(item.key, e.currentTarget) : null)}
            >
              {item.label}
              {item.children?.length ? <span className="catbar__caret" aria-hidden="true">▾</span> : null}
            </Link>
          ))}
          <Link href="/b2b" className={`catbar__item catbar__item--b2b${pathname === '/b2b' ? ' catbar__item--active' : ''}`}>B2B / Bulk</Link>
        </div>

        <button type="button" className={`catbar__arrow catbar__arrow--right${canRight ? ' is-on' : ''}`} onClick={() => scrollBy(260)} aria-label="Scroll categories right" tabIndex={canRight ? 0 : -1}>›</button>
      </div>

      {/* Portal: the navbar uses backdrop-filter, which would otherwise break position:fixed */}
      {openItem && openItem.children?.length > 0 && typeof document !== 'undefined' && createPortal(
        <div
          className="catbar__menu"
          style={{ left: menu.left, top: menu.top }}
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={scheduleClose}
          role="menu"
        >
          <Link href={openItem.href} className="catbar__menu-head" role="menuitem" onClick={() => setMenu(null)}>
            All {openItem.label}
          </Link>
          {openItem.children.map((ch) => (
            <Link key={ch.id} href={`/category/${ch.slug}`} className="catbar__menu-link" role="menuitem" onClick={() => setMenu(null)}>
              <span>{ch.name}</span>
              <span className="catbar__count">{ch.count}</span>
            </Link>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
