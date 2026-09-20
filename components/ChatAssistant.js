'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const REPLIES = [
  { id: 'products', chip: '📦 Browse products', text: 'You can browse everything in our catalogue, filter by category, brand and price.', link: { href: '/products', label: 'Open catalogue' } },
  { id: 'price', chip: '💰 Prices & availability', text: 'Prices and stock shown on the site are live. Use the search box (or Ctrl+K) to find any product by name, brand or SKU.', link: { href: '/products?stock=in', label: 'See in-stock items' } },
  { id: 'order', chip: '🛒 How to order', text: 'Add items to your cart, sign in, enter your delivery details and confirm. Cash on Delivery is available.', link: { href: '/cart', label: 'Open cart' } },
  { id: 'bulk', chip: '🏢 Bulk / B2B order', text: 'Need larger quantities or special pricing? Send us a quick quote request and we will reply with the best rate.', link: { href: '/b2b', label: 'Request a quote' } },
  { id: 'track', chip: '📋 Track my order', text: 'Enter your order ID (and the phone number used on the order) to see live delivery status.', link: { href: '/order-tracking', label: 'Track order' } },
  { id: 'contact', chip: '📞 Contact info', text: 'Talk to a real person – call, WhatsApp or send us a message.', link: { href: '/contact', label: 'Contact page' } },
];

/** Floating help widget: quick answers + WhatsApp hand-off. No external AI service, no API key needed. */
export default function ChatAssistant({ store = {} }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState([]);
  const bodyRef = useRef(null);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [thread, open]);
  if (pathname?.startsWith('/admin')) return null;

  const wa = String(store.whatsapp || store.phone || '').replace(/[^0-9]/g, '');
  const waHref = wa ? `https://wa.me/${wa.startsWith('0') ? `92${wa.slice(1)}` : wa}` : '';

  const ask = (r) => setThread((t) => [...t, { from: 'user', text: r.chip.replace(/^\S+\s/, '') }, { from: 'bot', text: r.text, link: r.link }]);

  return (
    <div className={`assistant${open ? ' assistant--open' : ''}`}>
      {open && (
        <div className="assistant__panel" role="dialog" aria-label={`${store.name || 'Store'} assistant`}>
          <div className="assistant__head">
            <div>
              <strong>{store.name || 'TechNest'} Assistant</strong>
              <span><i /> Online</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">&times;</button>
          </div>
          <div className="assistant__msgs" ref={bodyRef}>
            <div className="assistant__msg assistant__msg--bot">
              Salam! 👋 I can help with products, prices, orders, bulk quotes and tracking. What would you like to know?
            </div>
            {thread.map((m, i) => (
              <div key={i} className={`assistant__msg assistant__msg--${m.from}`}>
                {m.text}
                {m.link && <Link href={m.link.href} onClick={() => setOpen(false)} className="assistant__link">{m.link.label} →</Link>}
              </div>
            ))}
          </div>
          <div className="assistant__chips">
            {REPLIES.map((r) => (
              <button key={r.id} type="button" className="assistant__chip" onClick={() => ask(r)}>{r.chip}</button>
            ))}
          </div>
          {waHref && (
            <a className="assistant__wa" href={waHref} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          )}
        </div>
      )}
      <button type="button" className="assistant__fab" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close assistant' : 'Open assistant'}>
        {open ? '×' : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
        {!open && <span className="assistant__dot" aria-hidden="true" />}
      </button>
    </div>
  );
}
