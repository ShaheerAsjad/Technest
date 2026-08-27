import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess(); // admin-only
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const logs = await sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`;
  return NextResponse.json(logs);
}
