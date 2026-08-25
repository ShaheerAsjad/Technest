import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/loyalty  → { points, totalSpent, tier }
// Points are derived entirely from the existing `orders` table
// (1 point per $10 spent) — no new table or column required.
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ points: 0, totalSpent: 0, tier: 'Guest' });
    }

    const [row] = await sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total_spent
      FROM orders
      WHERE user_id = ${userId}
    `;

    const totalSpent = Number(row?.total_spent || 0);
    const points = Math.floor(totalSpent / 10);

    let tier = 'Bronze';
    if (totalSpent >= 2000) tier = 'Platinum';
    else if (totalSpent >= 1000) tier = 'Gold';
    else if (totalSpent >= 300) tier = 'Silver';

    return NextResponse.json({ points, totalSpent, tier });
  } catch (error) {
    console.error('Loyalty GET error:', error);
    return NextResponse.json({ points: 0, totalSpent: 0, tier: 'Bronze' });
  }
}
