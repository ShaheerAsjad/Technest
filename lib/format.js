export const CURRENCY_PREFIX = 'Rs. ';

/** 9900 -> "Rs. 9,900"   |   1234.5 -> "Rs. 1,234.50"   |  bad input -> "Rs. 0" */
export function formatPrice(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${CURRENCY_PREFIX}0`;
  const hasDecimals = Math.abs(n - Math.round(n)) > 0.004;
  const txt = n.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_PREFIX}${txt}`;
}

export function truncateText(text, maxLength = 38) {
  const t = String(text ?? '');
  return t.length > maxLength ? `${t.slice(0, maxLength).trim()}...` : t;
}

/** rating: number (0-5) or null/0 -> string of 5 stars. */
export function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export function slugify(input) {
  return String(input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}
