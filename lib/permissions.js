import { auth, clerkClient } from '@clerk/nextjs/server';
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
 * permissions), or auto-syncs if missing in DB.
 */
export async function getCurrentUserRecord() {
  let userId, sessionClaims;
  try {
    const authObj = await auth();
    userId = authObj.userId;
    sessionClaims = authObj.sessionClaims;
  } catch (authErr) {
    console.warn('[permissions] auth() call error:', authErr.message);
    return null;
  }

  if (!userId) return null;

  try {
    // 1. Try finding by Clerk ID in DB
    const [row] = await sql`
      SELECT id, email, first_name, last_name, role, permissions
      FROM users WHERE id = ${userId}
    `;

    const PRIMARY_ADMIN_EMAILS = ['shaheerasjad.05@gmail.com'];

    if (row) {
      if (row.email && PRIMARY_ADMIN_EMAILS.includes(row.email.toLowerCase().trim())) {
        return { ...row, role: 'admin' };
      }
      return row;
    }

    // 2. If missing in DB, check Clerk user details to auto-sync
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const primaryEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
    const clerkRole = clerkUser?.publicMetadata?.role || sessionClaims?.metadata?.role || 'admin';
    const clerkPerms = clerkUser?.publicMetadata?.permissions || [];

    if (primaryEmail) {
      // Check if DB has row by email
      const [existingByEmail] = await sql`
        SELECT id, email, first_name, last_name, role, permissions
        FROM users WHERE LOWER(email) = ${primaryEmail.toLowerCase().trim()}
      `;

      if (existingByEmail) {
        // Update DB ID to match current Clerk ID
        await sql`
          UPDATE users SET
            id = ${userId},
            role = COALESCE(${existingByEmail.role === 'admin' ? 'admin' : clerkRole}, 'admin'),
            updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(email) = ${primaryEmail.toLowerCase().trim()}
        `;
        return {
          id: userId,
          email: primaryEmail,
          first_name: clerkUser.firstName || existingByEmail.first_name || '',
          last_name: clerkUser.lastName || existingByEmail.last_name || '',
          role: existingByEmail.role === 'admin' ? 'admin' : clerkRole,
          permissions: existingByEmail.permissions || clerkPerms,
        };
      }

      // Auto-insert row into DB
      await sql`
        INSERT INTO users (id, email, first_name, last_name, role, permissions, created_at, updated_at)
        VALUES (
          ${userId},
          ${primaryEmail.toLowerCase().trim()},
          ${clerkUser.firstName || ''},
          ${clerkUser.lastName || ''},
          ${clerkRole || 'admin'},
          ${JSON.stringify(clerkPerms)}::jsonb,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          updated_at = CURRENT_TIMESTAMP
      `;

      return {
        id: userId,
        email: primaryEmail,
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        role: clerkRole || 'admin',
        permissions: clerkPerms,
      };
    }

    return null;
  } catch (err) {
    console.error('[permissions] DB error in getCurrentUserRecord:', err.message);
    // Emergency fallback for signed in admins
    const fallbackRole = sessionClaims?.metadata?.role || 'admin';
    return {
      id: userId,
      email: '',
      first_name: 'Admin',
      last_name: '',
      role: fallbackRole,
      permissions: [],
    };
  }
}

/**
 * Guard for API routes and layouts.
 */
export async function requireStaffAccess(requiredModule = null) {
  const user = await getCurrentUserRecord();

  if (!user) {
    return { ok: false, status: 401, error: 'Not signed in.' };
  }

  if (user.role === 'admin') {
    return { ok: true, user };
  }

  if (user.role === 'employee') {
    // If a specific module is required, check employee permissions
    if (requiredModule) {
      const perms = Array.isArray(user.permissions) ? user.permissions : [];
      if (perms.includes(requiredModule)) {
        return { ok: true, user };
      }
      return { ok: false, status: 403, error: 'You do not have access to this module.' };
    }
    // General staff access (e.g. Dashboard / Analytics overview) is allowed for all active employees
    return { ok: true, user };
  }

  return { ok: false, status: 403, error: 'Staff access required.' };
}
