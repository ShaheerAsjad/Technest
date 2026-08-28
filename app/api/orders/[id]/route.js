import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await sql`SELECT * FROM orders WHERE id = ${id}`;

    const rows = Array.isArray(result) ? result : (result.rows || []);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const order = rows[0];

    // Safely parse items if stored as stringified JSON
    if (typeof order.items === 'string') {
      try {
        order.items = JSON.parse(order.items);
      } catch (e) {
        console.error('Error parsing order items JSON:', e);
      }
    }

    return NextResponse.json(order, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('Fetch Order Error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
