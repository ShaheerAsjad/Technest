import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { getCurrentUserRecord } from '@/lib/permissions';

const NAV_ITEMS = [
  { href: '/admin',            label: 'Dashboard',     module: 'analytics', icon: '◆' },
  { href: '/admin/orders',     label: 'Orders',        module: 'orders',    icon: '▤' },
  { href: '/admin/products',   label: 'Inventory',     module: 'inventory', icon: '▦' },
  { href: '/admin/coupons',    label: 'Coupons',       module: 'coupons',   icon: '◈' },
  { href: '/admin/support',    label: 'Support Inbox', module: 'support',   icon: '✉' },
  { href: '/admin/staff',      label: 'Staff & Roles', module: null, adminOnly: true, icon: '◉' },
  { href: '/admin/audit-logs', label: 'Audit Logs',    module: null, adminOnly: true, icon: '☰' },
];

export default async function AdminLayout({ children }) {
  const user = await getCurrentUserRecord();

  // Not signed in or not staff → redirect to home
  if (!user || (user.role !== 'admin' && user.role !== 'employee')) {
    redirect('/');
  }

  const isAdmin = user.role === 'admin';
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  // Build visible sidebar items for this user
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
            Welcome, {user.first_name || user.email || 'there'}
          </span>
          <UserButton />
        </header>

        <main className="admin-content">
          {!isAdmin && visibleItems.length === 0 ? (
            <div style={{
              maxWidth: '520px',
              margin: '60px auto',
              padding: '36px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '1.25rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
              <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
                Module Access Required
              </h2>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
                Your employee account is active ({user.email}). However, an administrator has not yet assigned any module permissions (Orders, Inventory, Coupons, etc.) to your profile.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href="/" className="btn btn--secondary">
                  Return to Storefront
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
