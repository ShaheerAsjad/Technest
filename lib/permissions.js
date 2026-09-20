import { auth, clerkClient } from '@clerk/nextjs/server';
import sql from './db';
import { adminEmails } from './env';

// All modules that can be individually granted to an employee.
// Admins implicitly have every module - this list only matters for the 'employee' role.
export const MODULES = [
  { key: 'orders',    label: 'Orders' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'coupons',   label: 'Coupons' },
  { key: 'support',   label: 'Support Inbox' },
  { key: 'analytics', label: 'Analytics' },
];

/** Errors Next.js uses internally (dynamic-rendering bailout, redirect, notFound) must never be swallowed. */
function isNextControlFlowError(err) {
  const digest = String(err?.digest || '');
  return (
    digest === 'DYNAMIC_SERVER_USAGE' ||
    digest.startsWith('NEXT_REDIRECT') ||
    digest.startsWith('NEXT_NOT_FOUND') ||
    /Dynamic server usage|couldn't be rendered statically/i.test(String(err?.message || ''))
  );
}

const isAdminEmail = (email) => {
  const e = String(email || '').toLowerCase().trim();
  return Boolean(e) && adminEmails().includes(e);
};

/**
 * Returns the signed-in user's row from our `users` table (role + permissions),
 * auto-creating it from Clerk on first sight.
 *
 * SECURITY: the default role is ALWAYS 'customer'. Admin comes only from
 *   (a) the users table, or (b) an e-mail listed in the ADMIN_EMAILS env var.
 * Errors never upgrade anybody to admin.
 */
export async function getCurrentUserRecord() {
  let userId, sessionClaims;
  try {
    const authObj = await auth();
    userId = authObj.userId;
    sessionClaims = authObj.sessionClaims;
  } catch (authErr) {
    // Next.js signals "this page must be rendered per request" with a special error.
    // Swallowing it is what caused the noisy build logs - always let it through.
    if (isNextControlFlowError(authErr)) throw authErr;
    console.warn('[permissions] auth() call error:', authErr.message);
    return null;
  }
  if (!userId) return null;

  try {
    // 1. Known user?
    const [row] = await sql`
      SELECT id, email, first_name, last_name, role, permissions
      FROM users WHERE id = ${userId}
    `;
    if (row) {
      const role = isAdminEmail(row.email) ? 'admin' : row.role || 'customer';
      return { ...row, role };
    }

    // 2. First time we see this Clerk user -> sync from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const primaryEmail = (clerkUser?.emailAddresses?.[0]?.emailAddress || '').toLowerCase().trim();
    const metaRole = clerkUser?.publicMetadata?.role || sessionClaims?.metadata?.role;
    const clerkRole = ['admin', 'employee', 'customer'].includes(metaRole) ? metaRole : 'customer';
    const clerkPerms = Array.isArray(clerkUser?.publicMetadata?.permissions) ? clerkUser.publicMetadata.permissions : [];
    const role = isAdminEmail(primaryEmail) ? 'admin' : clerkRole;

    if (!primaryEmail) return null;

    const [existingByEmail] = await sql`
      SELECT id, email, first_name, last_name, role, permissions
      FROM users WHERE LOWER(email) = ${primaryEmail}
    `;

    if (existingByEmail) {
      // Same person, new Clerk id -> re-link the row; keep whatever role we already stored.
      const keepRole = isAdminEmail(primaryEmail) ? 'admin' : existingByEmail.role || 'customer';
      await sql`
        UPDATE users SET id = ${userId}, role = ${keepRole}, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(email) = ${primaryEmail}
      `;
      return {
        id: userId,
        email: primaryEmail,
        first_name: clerkUser.firstName || existingByEmail.first_name || '',
        last_name: clerkUser.lastName || existingByEmail.last_name || '',
        role: keepRole,
        permissions: existingByEmail.permissions || clerkPerms,
      };
    }

    await sql`
      INSERT INTO users (id, email, first_name, last_name, role, permissions, created_at, updated_at)
      VALUES (${userId}, ${primaryEmail}, ${clerkUser.firstName || ''}, ${clerkUser.lastName || ''},
              ${role}, ${JSON.stringify(clerkPerms)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = CURRENT_TIMESTAMP
    `;
    return {
      id: userId,
      email: primaryEmail,
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      role,
      permissions: clerkPerms,
    };
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    console.error('[permissions] error in getCurrentUserRecord:', err.message);
    // Fail SAFE: a plain customer, never an admin.
    return { id: userId, email: '', first_name: '', last_name: '', role: 'customer', permissions: [] };
  }
}

/** Guard for API routes and layouts. */
export async function requireStaffAccess(requiredModule = null) {
  const user = await getCurrentUserRecord();
  if (!user) return { ok: false, status: 401, error: 'Not signed in.' };

  if (user.role === 'admin') return { ok: true, user };

  if (user.role === 'employee') {
    if (requiredModule) {
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      if (perms.includes(requiredModule)) return { ok: true, user };
      return { ok: false, status: 403, error: 'You do not have access to this module.' };
    }
    return { ok: true, user };
  }
  return { ok: false, status: 403, error: 'Staff access required.' };
}

/** Admin-only guard (settings, staff, audit logs). */
export async function requireAdmin() {
  const access = await requireStaffAccess();
  if (!access.ok) return access;
  if (access.user.role !== 'admin') return { ok: false, status: 403, error: 'Admin access required.' };
  return access;
}

export const actorName = (user) => `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
