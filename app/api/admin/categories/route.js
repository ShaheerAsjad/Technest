import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await sql`SELECT id, name FROM categories ORDER BY name ASC`;
    return NextResponse.json(categories);
  } catch (err) {
    console.error('[categories] Error:', err.message);
    return NextResponse.json([], { status: 200 }); // return empty, don't crash
  }
}
