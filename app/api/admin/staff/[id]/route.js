import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const access = await requireStaffAccess(); // admin-only
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  const { firstName, lastName, email, password, role, permissions } = await request.json();

  if (role && !['customer', 'employee', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  if (password && password.length < 10) {
    return NextResponse.json({ error: 'Password must be at least 10 characters long.' }, { status: 400 });
  }

  const safePermissions = Array.isArray(permissions) ? permissions : [];
  const client = await clerkClient();

  try {
    let targetClerkId = id;

    // Find actual Clerk User ID by email if available to prevent ID mismatch
    if (email) {
      try {
        const searchList = await client.users.getUserList({ emailAddress: [email.toLowerCase().trim()] });
        if (searchList.data && searchList.data.length > 0) {
          targetClerkId = searchList.data[0].id;
        }
      } catch (searchErr) {
        console.warn('[admin/staff PATCH] Clerk search warning:', searchErr.message);
      }
    }

    // Step 1: Update Clerk user
    const clerkUpdatePayload = {
      publicMetadata: { role, permissions: safePermissions },
    };
    if (firstName !== undefined && firstName !== '') clerkUpdatePayload.firstName = firstName;
    if (lastName !== undefined && lastName !== '') clerkUpdatePayload.lastName = lastName;
    if (password) clerkUpdatePayload.password = password;

    try {
      await client.users.updateUser(targetClerkId, clerkUpdatePayload);
    } catch (clerkErr) {
      console.error('[admin/staff PATCH] Clerk update error:', clerkErr);
      const msg = clerkErr?.errors?.[0]?.longMessage || clerkErr?.errors?.[0]?.message || clerkErr.message || 'Failed to update user password in Clerk.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Step 2: Update Neon DB record
    await sql`
      UPDATE users SET
        first_name = COALESCE(${firstName !== undefined ? firstName : null}, first_name),
        last_name = COALESCE(${lastName !== undefined ? lastName : null}, last_name),
        email = COALESCE(${email || null}, email),
        role = COALESCE(${role || null}, role),
        permissions = ${JSON.stringify(safePermissions)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} OR LOWER(email) = ${email ? email.toLowerCase().trim() : ''}
    `;

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'staff.updated',
      targetType: 'user',
      targetId: targetClerkId,
      details: { role, permissions: safePermissions, firstName, lastName, emailUpdated: Boolean(email), passwordChanged: Boolean(password) },
    });

    return NextResponse.json({ success: true, message: 'User details & password updated in Clerk successfully!' });
  } catch (error) {
    console.error('Staff update error:', error);
    return NextResponse.json({ error: error.message || 'Could not update this user.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const access = await requireStaffAccess(); // admin-only
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { id } = await params;
  try {
    // Delete from DB
    await sql`DELETE FROM users WHERE id = ${id}`;

    // Try deleting from Clerk
    const client = await clerkClient();
    try {
      await client.users.deleteUser(id);
    } catch (clerkErr) {
      console.warn('[admin/staff DELETE] Clerk delete warning:', clerkErr.message);
    }

    return NextResponse.json({ success: true, message: 'Staff member removed.' });
  } catch (err) {
    console.error('[admin/staff DELETE] Error:', err.message);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
