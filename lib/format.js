export function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

export function truncateText(text, maxLength = 38) {
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}…` : text;
}

export function renderStars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
