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
  const { role, permissions } = await request.json();

  if (!['customer', 'employee', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const safePermissions = Array.isArray(permissions) ? permissions : [];

  try {
    await sql`
      UPDATE users SET role = ${role}, permissions = ${JSON.stringify(safePermissions)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `;

    // Mirror into Clerk's publicMetadata so middleware (which reads
    // the JWT, not the DB) sees the new role immediately.
    const client = await clerkClient();
    await client.users.updateUserMetadata(id, {
      publicMetadata: { role, permissions: safePermissions },
    });

    await writeAuditLog({
      actorUserId: access.user.id,
      actorName: `${access.user.first_name || ''} ${access.user.last_name || ''}`.trim(),
      action: 'staff.role_changed',
      targetType: 'user',
      targetId: id,
      details: { role, permissions: safePermissions },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Staff update error:', error);
    return NextResponse.json({ error: 'Could not update this user.' }, { status: 500 });
  }
}
