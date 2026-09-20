import sql from './db';

/**
 * Tiny DB-backed rate limiter for public POST endpoints.
 *   allowed = await rateLimit(`support:${ip}`, 5, 600)   // 5 requests / 10 min
 * FAILS OPEN: if the DB is unreachable we allow the request rather than
 * blocking real customers.
 */
export async function rateLimit(key, max, windowSeconds) {
  try {
    const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
    const k = `${String(key).slice(0, 120)}:${bucket}`;
    const rows = await sql`
      INSERT INTO rate_limits (key, count, created_at)
      VALUES (${k}, 1, NOW())
      ON CONFLICT (key) DO UPDATE SET count = rate_limits.count + 1
      RETURNING count
    `;
    const count = Number(rows?.[0]?.count || 1);
    // Opportunistic cleanup (about 1 in 50 calls) so the table never grows.
    if (Math.random() < 0.02) {
      sql`DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 day'`.catch(() => {});
    }
    return count <= max;
  } catch (err) {
    console.warn('[ratelimit] skipped:', err?.message);
    return true;
  }
}
