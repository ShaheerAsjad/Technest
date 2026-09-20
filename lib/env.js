// Environment checks used by /api/health and the verify script.
export const REQUIRED_ENV = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
];

export const OPTIONAL_ENV = [
  'ADMIN_EMAILS',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'CLERK_WEBHOOK_SECRET',
];

export function envStatus() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  const optionalMissing = OPTIONAL_ENV.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing, optionalMissing };
}

/** Comma-separated ADMIN_EMAILS -> lowercase array. */
export function adminEmails() {
  return String(process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
