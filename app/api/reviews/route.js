import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/reviews?productId=5  → { reviews: [...], average: 4.3, count: 12 }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const reviews = await sql`
      SELECT id, user_id, user_name, rating, comment, created_at
      FROM reviews
      WHERE product_id = ${productId}
      ORDER BY created_at DESC
    `;

    const count = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

    return NextResponse.json({
      reviews,
      average: Math.round(average * 10) / 10,
      count,
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    // If the table doesn't exist yet (migration not run), fail gracefully.
    return NextResponse.json({ reviews: [], average: 0, count: 0 });
  }
}

// POST /api/reviews  { productId, rating, comment }  → requires sign-in
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to leave a review.' }, { status: 401 });
    }

    const { productId, rating, comment } = await request.json();

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'A valid productId and rating (1-5) are required.' }, { status: 400 });
    }

    const user = await currentUser();
    const userName =
      user?.fullName ||
      user?.firstName ||
      user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
      'TechNest Customer';

    const [review] = await sql`
      INSERT INTO reviews (product_id, user_id, user_name, rating, comment)
      VALUES (${productId}, ${userId}, ${userName}, ${rating}, ${comment || ''})
      RETURNING id, user_id, user_name, rating, comment, created_at
    `;

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: 'Could not save your review. Please try again.' }, { status: 500 });
  }
}
