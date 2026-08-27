import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { requireStaffAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await requireStaffAccess('support');
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const messages = await sql`SELECT * FROM support_messages ORDER BY created_at DESC`;
  return NextResponse.json(messages);
}
