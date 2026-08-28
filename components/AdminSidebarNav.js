'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ORDERS_STORAGE_KEY = 'technest_last_viewed_orders';

export default function AdminSidebarNav({ visibleItems }) {
  const pathname = usePathname();
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [unreadSupport, setUnreadSupport] = useState(0);

  // Whenever user visits /admin/orders, mark orders as viewed
  useEffect(() => {
    if (pathname === '/admin/orders') {
      localStorage.setItem(ORDERS_STORAGE_KEY, String(Date.now()));
      setUnreadOrders(0);
    }
  }, [pathname]);

  // Periodically check for new unread orders & support tickets
  useEffect(() => {
    async function checkUnread() {
      // 1. Orders check
      if (pathname === '/admin/orders') {
        setUnreadOrders(0);
      } else {
        const lastViewed = localStorage.getItem(ORDERS_STORAGE_KEY) || '0';
        try {
          const res = await fetch(`/api/admin/orders/unread?since=${lastViewed}`);
          if (res.ok) {
            const data = await res.json();
            setUnreadOrders(Number(data.unreadCount) || 0);
          }
        } catch (err) {
          console.warn('Unread orders check error:', err);
        }
      }

      // 2. Support Inbox check
      if (pathname === '/admin/support') {
        setUnreadSupport(0);
      } else {
        try {
          const res = await fetch('/api/admin/support/unread');
          if (res.ok) {
            const data = await res.json();
            setUnreadSupport(Number(data.unreadCount) || 0);
          }
        } catch (err) {
          console.warn('Unread support check error:', err);
        }
      }
    }

    checkUnread();
    const interval = setInterval(checkUnread, 5000); // Check every 5 seconds for real-time responsiveness
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <nav className="admin-sidebar__nav">
      {visibleItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        const isOrders = item.href === '/admin/orders';
        const isSupport = item.href === '/admin/support';

        let badgeCount = 0;
        if (isOrders && unreadOrders > 0) badgeCount = unreadOrders;
        if (isSupport && unreadSupport > 0) badgeCount = unreadSupport;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`}
            onClick={() => {
              if (isOrders) {
                localStorage.setItem(ORDERS_STORAGE_KEY, String(Date.now()));
                setUnreadOrders(0);
              }
              if (isSupport) {
                setUnreadSupport(0);
              }
            }}
          >
            <span className="admin-sidebar__icon">{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {badgeCount > 0 && (
              <span className="admin-sidebar__unread-badge" title={`${badgeCount} new notification${badgeCount > 1 ? 's' : ''}`}>
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
