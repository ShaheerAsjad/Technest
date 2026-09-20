export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim());
}

export function isValidZip(value) {
  return /^\d{4,6}$/.test(String(value ?? '').trim());
}

/** Pakistani mobile: 03XXXXXXXXX, 923XXXXXXXXX or +923XXXXXXXXX. */
export function normalizePkPhone(value) {
  const raw = String(value ?? '').trim();
  if (/[^0-9+\s-]/.test(raw)) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('03')) return digits;
  if (digits.length === 12 && digits.startsWith('923')) return `0${digits.slice(2)}`;
  return null;
}

export function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function cleanText(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}
