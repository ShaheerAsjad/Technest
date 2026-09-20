import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

// Serves an uploaded image from the `media` table (immutable, cached for a year).
export async function GET(_request, { params }) {
  try {
    const { id: rawId } = await params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id) || id <= 0) return new Response('Not found', { status: 404 });
    const rows = await sql`SELECT mime, encode(data, 'base64') AS b64 FROM media WHERE id = ${id}`;
    if (!rows[0]) return new Response('Not found', { status: 404 });
    const body = Buffer.from(rows[0].b64, 'base64');
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': rows[0].mime,
        'Content-Length': String(body.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[media] error:', err?.message);
    return new Response('Error', { status: 500 });
  }
}
