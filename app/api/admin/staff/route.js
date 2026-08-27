import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess(); // admin-only (no module = admin required)
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const users = await sql`
    SELECT id, email, first_name, last_name, image_url, role, permissions, created_at
    FROM users ORDER BY created_at DESC
  `;

  return NextResponse.json(users);
}
