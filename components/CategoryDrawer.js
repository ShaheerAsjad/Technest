'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const DEPT_LABELS = { networking: 'Networking & IT', consumer: 'Consumer Tech' };

/** Mobile "Shop by category" drawer (opened by the bottom-bar "Shop" tab). */
export default function CategoryDrawer({ tree, phone = '' }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('technest:open-categories', onOpen);
    return () => window.removeEventListener('technest:open-categories', onOpen);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!open) return null;
  const depts = ['networking', 'consumer'].filter((d) => tree?.departments?.[d]?.length);
  const tel = phone ? phone.replace(/[^0-9+]/g, '') : '';

  return (
    <div className="catdrawer" role="dialog" aria-modal="true" aria-label="Shop by category">
      <div className="catdrawer__backdrop" onClick={() => setOpen(false)} />
      <aside className="catdrawer__panel">
        <div className="catdrawer__head">
          <span>Shop by Category</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">&times;</button>
        </div>

        <div className="catdrawer__body">
          <Link href="/products" className="catdrawer__row catdrawer__row--all">All Products</Link>
          {depts.map((d) => (
            <div key={d} className="catdrawer__dept">
              <p className="catdrawer__dept-title">{DEPT_LABELS[d]}</p>
              {tree.departments[d].map((c) => (
                <div key={c.id} className="catdrawer__group">
                  <div className="catdrawer__row">
                    <Link href={`/category/${c.slug}`} className="catdrawer__link">
                      {c.name} <span className="catdrawer__count">{c.count}</span>
                    </Link>
                    {c.children?.length > 0 && (
                      <button
                        type="button"
                        className={`catdrawer__toggle${expanded[c.id] ? ' is-open' : ''}`}
                        onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))}
                        aria-label={`Show ${c.name} sub-categories`}
                        aria-expanded={Boolean(expanded[c.id])}
                      >›</button>
                    )}
                  </div>
                  {expanded[c.id] && c.children.map((ch) => (
                    <Link key={ch.id} href={`/category/${ch.slug}`} className="catdrawer__sub">
                      {ch.name} <span className="catdrawer__count">{ch.count}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="catdrawer__foot">
          {tel ? <a href={`tel:${tel}`}>{phone}</a> : <span />}
          <Link href="/b2b" className="catdrawer__b2b">B2B</Link>
        </div>
      </aside>
    </div>
  );
}
