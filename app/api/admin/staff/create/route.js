import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const access = await requireStaffAccess(); // admin only
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { firstName, lastName, email, password, role, permissions } = await request.json();

    // Validate inputs
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 });
    }
    if (!['employee', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Role must be employee or admin.' }, { status: 400 });
    }
    if (password && password.length < 10) {
      return NextResponse.json({ error: 'Password must be at least 10 characters long.' }, { status: 400 });
    }

    const safePermissions = Array.isArray(permissions) ? permissions : [];
    const client = await clerkClient();

    let clerkUser;
    let isExisting = false;

    // Check if user already exists in Clerk
    try {
      const existingList = await client.users.getUserList({ emailAddress: [email.toLowerCase().trim()] });
      if (existingList.data && existingList.data.length > 0) {
        clerkUser = existingList.data[0];
        isExisting = true;
      }
    } catch (searchErr) {
      console.warn('[admin/staff/create] Search user warning:', searchErr.message);
    }

    if (isExisting && clerkUser) {
      // User exists -> Update Clerk user metadata, names, and password if provided
      const updatePayload = {
        publicMetadata: { role, permissions: safePermissions },
      };
      if (firstName) updatePayload.firstName = firstName;
      if (lastName) updatePayload.lastName = lastName;
      if (password) updatePayload.password = password;

      try {
        clerkUser = await client.users.updateUser(clerkUser.id, updatePayload);
      } catch (updateErr) {
        const msg = updateErr?.errors?.[0]?.longMessage || updateErr?.errors?.[0]?.message || 'Failed to update existing user in Clerk.';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else {
      // New user -> Create in Clerk
      if (!password) {
        return NextResponse.json({ error: 'Password is required for new user accounts.' }, { status: 400 });
      }
      try {
        clerkUser = await client.users.createUser({
          emailAddress: [email.toLowerCase().trim()],
          password,
          firstName: firstName || '',
          lastName: lastName || '',
          publicMetadata: { role, permissions: safePermissions },
        });
      } catch (clerkErr) {
        const msg = clerkErr?.errors?.[0]?.longMessage || clerkErr?.errors?.[0]?.message || 'Failed to create Clerk user.';
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // Step 2: Upsert into Neon DB `users` table
    await sql`
      INSERT INTO users (id, email, first_name, last_name, role, permissions, created_at, updated_at)
      VALUES (
        ${clerkUser.id},
        ${email.toLowerCase().trim()},
        ${firstName || clerkUser.firstName || ''},
        ${lastName || clerkUser.lastName || ''},
        ${role},
        ${JSON.stringify(safePermissions)}::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), users.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), users.last_name),
        role = EXCLUDED.role,
        permissions = EXCLUDED.permissions,
        updated_at = CURRENT_TIMESTAMP
    `;

    // Also update by email in case DB row has different ID
    await sql`
      UPDATE users
      SET role = ${role},
          permissions = ${JSON.stringify(safePermissions)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email.toLowerCase().trim()}
    `;

    // Audit log
    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: isExisting ? 'staff.updated' : 'staff.created',
      targetType: 'user',
      targetId: clerkUser.id,
      details: { email, role, permissions: safePermissions, isExisting },
    });

    return NextResponse.json({
      success: true,
      isExisting,
      message: isExisting
        ? `Existing user account (${email}) has been updated with ${role} role & new permissions!`
        : `New staff member (${email}) created successfully!`,
      user: {
        id: clerkUser.id,
        email,
        firstName: firstName || clerkUser.firstName || '',
        lastName: lastName || clerkUser.lastName || '',
        role,
        permissions: safePermissions,
      }
    }, { status: 200 });

  } catch (err) {
    console.error('[admin/staff/create] Error:', err.message);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
