import { auth } from '@clerk/nextjs/server';
import sql from './db';

// All modules that can be individually granted to an employee.
// Admins implicitly have every module — this list only matters
// for the 'employee' role.
export const MODULES = [
  { key: 'orders',    label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'coupons',   label: 'Coupons' },
  { key: 'support',   label: 'Support Inbox' },
  { key: 'analytics', label: 'Analytics' },
];

/**
 * Returns the signed-in user's row from our `users` table (role +
 * permissions), or null if not signed in / not found yet (e.g. the
 * webhook hasn't synced them — first few seconds after signup).
 */
export async function getCurrentUserRecord() {
  const { userId } = await auth();
  if (!userId) return null;

  const [row] = await sql`
    SELECT id, email, first_name, last_name, role, permissions
    FROM users WHERE id = ${userId}
  `;
  return row || null;
}

/**
 * Throws-free guard for API routes. Returns { ok: true, user } or
 * { ok: false, status, error } — the route decides what to do with it.
 *
 * requiredModule: pass a MODULES key (e.g. 'orders') to also allow
 * employees who have that specific permission. Admins always pass.
 * Pass null/undefined to require admin-only access (e.g. Staff Mgmt).
 */
export async function requireStaffAccess(requiredModule = null) {
  const user = await getCurrentUserRecord();

  if (!user) {
    return { ok: false, status: 401, error: 'Not signed in.' };
  }

  if (user.role === 'admin') {
    return { ok: true, user };
  }

  if (user.role === 'employee' && requiredModule) {
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    if (perms.includes(requiredModule)) {
      return { ok: true, user };
    }
    return { ok: false, status: 403, error: 'You do not have access to this module.' };
  }

  return { ok: false, status: 403, error: 'Staff access required.' };
}
