import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const access = await requireStaffAccess(); // admin-only
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Filter to return ONLY staff members (admins and employees), excluding standard customers
    const users = await sql`
      SELECT id, email, first_name, last_name, image_url, role, permissions, created_at
      FROM users
      WHERE role IN ('admin', 'employee')
      ORDER BY role ASC, created_at DESC
    `;

    return NextResponse.json(users);
  } catch (err) {
    console.error('[admin/staff] Error:', err.message);
    return NextResponse.json({ error: 'Failed to load staff list.' }, { status: 500 });
  }
}
