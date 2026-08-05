export function isRequired(value) {
  return value.trim().length > 0;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidZip(value) {
  return /^\d{4,6}$/.test(value.trim());
}
