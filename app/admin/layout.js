import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { getCurrentUserRecord, MODULES } from '@/lib/permissions';

const NAV_ITEMS = [
  { href: '/admin',          label: 'Dashboard',   module: 'analytics', icon: '◆' },
  { href: '/admin/orders',   label: 'Orders',      module: 'orders',    icon: '▤' },
  { href: '/admin/products', label: 'Inventory',   module: 'inventory', icon: '▦' },
  { href: '/admin/coupons',  label: 'Coupons',     module: 'coupons',   icon: '◈' },
  { href: '/admin/support',  label: 'Support Inbox', module: 'support', icon: '✉' },
  { href: '/admin/staff',    label: 'Staff & Roles', module: null, adminOnly: true, icon: '◉' },
  { href: '/admin/audit-logs', label: 'Audit Logs', module: null, adminOnly: true, icon: '☰' },
];

export default async function AdminLayout({ children }) {
  // Server-side, DB-backed check — the real source of truth.
  // (Middleware already blocked non-staff from reaching this far
  // using the faster JWT-based check, but we never trust that alone
  // for actually rendering sensitive data.)
  const user = await getCurrentUserRecord();

  if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
    redirect('/');
  }

  const isAdmin = user.role === 'admin';
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    return permissions.includes(item.module);
  });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__dot" />
          TechNest <span className="admin-sidebar__badge">{isAdmin ? 'Admin' : 'Staff'}</span>
        </div>

        <nav className="admin-sidebar__nav">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href} className="admin-sidebar__link">
              <span className="admin-sidebar__icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link href="/" className="admin-sidebar__link admin-sidebar__link--muted">
            ← Back to Store
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar__welcome">
            Welcome, {user.first_name || 'there'}
          </span>
          <UserButton />
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
