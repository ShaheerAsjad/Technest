import { neon } from '@neondatabase/serverless';

/**
 * Single shared Neon SQL client.
 *  - Tagged template:   await sql`SELECT * FROM products WHERE id = ${id}`
 *  - Dynamic SQL:       await sql.query('SELECT ... WHERE id = $1', [id])
 *
 * If DATABASE_URL is missing we do NOT crash at import time (that breaks
 * `next build`); instead every query throws a clear, friendly error.
 */
function missingClient() {
  const fail = () => {
    throw new Error(
      'DATABASE_URL is not set. Add it to .env.local (local) or to Vercel -> Settings -> Environment Variables.'
    );
  };
  const f = () => fail();
  f.query = fail;
  f.transaction = fail;
  return f;
}

const url = process.env.DATABASE_URL;
const sql = url ? neon(url) : missingClient();

export default sql;

/** Normalise driver output (array of rows, or { rows }) to a plain array. */
export function rowsOf(result) {
  if (Array.isArray(result)) return result;
  return (result && result.rows) || [];
}

const TRANSIENT = /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|timeout|socket|network|502|503|504|Control plane/i;

/**
 * Run a READ query with up to 3 attempts (Neon can be slow to wake up).
 * Never use for writes.
 */
export async function readQuery(text, params = []) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return rowsOf(await sql.query(text, params));
    } catch (err) {
      lastErr = err;
      if (!TRANSIENT.test(String(err?.message || err))) break;
      await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** Write / non-retried query with dynamic SQL. */
export async function writeQuery(text, params = []) {
  return rowsOf(await sql.query(text, params));
}
