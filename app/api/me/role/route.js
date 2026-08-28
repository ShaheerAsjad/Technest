import { NextResponse } from 'next/server';
import { getCurrentUserRecord } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/role
 * Returns the current signed-in user's role from DB.
 * Used by Navbar to conditionally show the Admin Dashboard button.
 */
export async function GET() {
  try {
    const user = await getCurrentUserRecord();

    if (!user) {
      return NextResponse.json({ role: 'customer' });
    }

    return NextResponse.json({
      role: user.role || 'customer',
    });
  } catch {
    return NextResponse.json({ role: 'customer' });
  }
}
