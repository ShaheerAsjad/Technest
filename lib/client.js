// Browser-only helpers (safe to import from 'use client' components).

/** fetch + JSON with a timeout and ONE retry on network failure. Never throws for HTTP errors. */
export async function fetchJson(url, options = {}, { timeout = 12000, retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...options, signal: options.signal || controller.signal });
      clearTimeout(timer);
      let data = null;
      try { data = await res.json(); } catch { /* empty body */ }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (options.signal?.aborted) break;
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return { ok: false, status: 0, data: null, error: lastErr };
}

export function newIdempotencyKey() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
