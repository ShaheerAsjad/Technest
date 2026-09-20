'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Scrolling top strip; text comes from Admin -> Settings -> Announcement bar. */
export default function AnnouncementBar({ enabled = true, messages = [] }) {
  const pathname = usePathname();
  if (!enabled || !messages.length || pathname?.startsWith('/admin')) return null;

  const items = messages.filter(Boolean);
  // repeat enough times that the strip is always wider than the screen
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="announce" role="region" aria-label="Announcements">
      <div className="announce__track">
        {[0, 1].map((copy) => (
          <div className="announce__group" key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>
            {loop.map((m, i) => (
              <span className="announce__item" key={`${copy}-${i}`}>
                <span className="announce__sep" aria-hidden="true">✦</span>
                {m}
              </span>
            ))}
          </div>
        ))}
      </div>
      <Link href="/products?sale=1" className="announce__cta">Shop deals</Link>
    </div>
  );
}
