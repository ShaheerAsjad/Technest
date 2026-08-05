const COUPONS = {
  SAVE10: { type: 'percent', value: 10, label: '10% off' },
  SAVE20: { type: 'percent', value: 20, label: '20% off' },
  FLAT15: { type: 'flat', value: 15, label: '$15 off' },
};

export function validateCoupon(code) {
  const coupon = COUPONS[code.trim().toUpperCase()];
  return coupon ? { code: code.trim().toUpperCase(), ...coupon } : null;
}

export function getDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === 'percent') return subtotal * (coupon.value / 100);
  return Math.min(coupon.value, subtotal);
}
